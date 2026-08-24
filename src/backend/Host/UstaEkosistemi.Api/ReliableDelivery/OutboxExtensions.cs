using System.Text.Json;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using System.Diagnostics;
using UstaEkosistemi.Api.Observability;

namespace UstaEkosistemi.Api.ReliableDelivery;

public sealed record CraftsmanNotificationPayload(Guid CraftsmanId, string Type, string Title, string Message, string? ReferenceType, Guid? ReferenceId);

public static class OutboxExtensions
{
    public const string CraftsmanNotificationType = "CraftsmanNotification";

    public static void QueueCraftsmanNotification(this UstaEkosistemiDbContext dbContext, Guid craftsmanId, string type, string title, string message, string? referenceType, Guid? referenceId)
    {
        var deduplicationKey = $"craftsman-notification:{craftsmanId:N}:{type}:{referenceType}:{referenceId:N}";
        dbContext.OutboxMessages.Add(new OutboxMessage
        {
            Type = CraftsmanNotificationType,
            Payload = JsonSerializer.Serialize(new CraftsmanNotificationPayload(craftsmanId, type, title, message, referenceType, referenceId)),
            DeduplicationKey = deduplicationKey,
            CorrelationId = CorrelationContext.Current ?? Activity.Current?.TraceId.ToString()
        });
    }
}
