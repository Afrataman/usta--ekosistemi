using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.ReliableDelivery;

public sealed class OutboxDispatcher(IServiceScopeFactory scopeFactory, ILogger<OutboxDispatcher> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var processed = await DispatchBatch(stoppingToken);
            await Task.Delay(processed == 0 ? TimeSpan.FromSeconds(5) : TimeSpan.FromMilliseconds(100), stoppingToken);
        }
    }

    private async Task<int> DispatchBatch(CancellationToken token)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<UstaEkosistemiDbContext>();
        var now = DateTimeOffset.UtcNow;
        var ids = await dbContext.OutboxMessages.AsNoTracking()
            .Where(x => x.Status == OutboxMessageStatus.Pending && x.NextAttemptAtUtc <= now)
            .OrderBy(x => x.CreatedAtUtc).Select(x => x.Id).Take(20).ToListAsync(token);

        foreach (var id in ids) await DispatchOne(dbContext, id, token);
        return ids.Count;
    }

    private async Task DispatchOne(UstaEkosistemiDbContext dbContext, Guid id, CancellationToken token)
    {
        var item = await dbContext.OutboxMessages.SingleAsync(x => x.Id == id, token);
        try
        {
            if (item.Type != OutboxExtensions.CraftsmanNotificationType) throw new InvalidOperationException($"Desteklenmeyen outbox türü: {item.Type}");
            var payload = JsonSerializer.Deserialize<CraftsmanNotificationPayload>(item.Payload) ?? throw new InvalidOperationException("Outbox içeriği okunamadı.");
            if (!await dbContext.CraftsmanNotifications.AnyAsync(x => x.Id == item.Id, token))
            {
                dbContext.CraftsmanNotifications.Add(new CraftsmanNotification
                {
                    Id = item.Id, CraftsmanId = payload.CraftsmanId, Type = payload.Type, Title = payload.Title,
                    Message = payload.Message, ReferenceType = payload.ReferenceType, ReferenceId = payload.ReferenceId
                });
            }
            item.Status = OutboxMessageStatus.Delivered;
            item.DeliveredAtUtc = DateTimeOffset.UtcNow;
            item.LastError = null;
            await dbContext.SaveChangesAsync(token);
        }
        catch (Exception exception) when (!token.IsCancellationRequested)
        {
            dbContext.ChangeTracker.Clear();
            item = await dbContext.OutboxMessages.SingleAsync(x => x.Id == id, token);
            item.AttemptCount++;
            item.LastError = exception.Message[..Math.Min(exception.Message.Length, 1000)];
            item.Status = item.AttemptCount >= 10 ? OutboxMessageStatus.Failed : OutboxMessageStatus.Pending;
            item.NextAttemptAtUtc = DateTimeOffset.UtcNow.AddSeconds(Math.Min(300, Math.Pow(2, item.AttemptCount)));
            await dbContext.SaveChangesAsync(token);
            logger.LogWarning(exception, "Outbox message {OutboxMessageId} could not be delivered", id);
        }
    }
}
