using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.FileProviders;
using UstaEkosistemi.Api.Controllers;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;
using UstaEkosistemi.Api.Sms;

namespace UstaEkosistemi.Api.Tests;

public sealed class PhoneChangeSecurityTests
{
    [Fact]
    public async Task Confirmed_phone_change_revokes_all_existing_sessions()
    {
        var options = new DbContextOptionsBuilder<UstaEkosistemiDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString("N")).Options;
        await using var db = new UstaEkosistemiDbContext(options);
        var craftsman = new Craftsman { PhoneNumber = "905550000001", FullName = "Test Ustası" };
        db.Craftsmen.Add(craftsman);
        db.CraftsmanSessions.AddRange(
            new CraftsmanSession { Craftsman = craftsman, TokenHash = CraftsmanSessionSecurity.HashToken("old-token-one"), ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(1) },
            new CraftsmanSession { Craftsman = craftsman, TokenHash = CraftsmanSessionSecurity.HashToken("old-token-two"), ExpiresAtUtc = DateTimeOffset.UtcNow.AddDays(1) });
        await db.SaveChangesAsync();
        using var cache = new MemoryCache(new MemoryCacheOptions());
        var controller = new CraftsmenController(db, new DevelopmentEnvironment(), cache, new NoopSmsDelivery());
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var request = Assert.IsType<OkObjectResult>(await controller.RequestPhoneChange(craftsman.Id, new PhoneChangeRequest("905551111111"), CancellationToken.None));
        using var document = JsonDocument.Parse(JsonSerializer.Serialize(request.Value));
        var challengeId = document.RootElement.GetProperty("Id").GetGuid();
        var code = document.RootElement.GetProperty("developmentCode").GetString();
        Assert.NotNull(code);

        Assert.IsType<OkObjectResult>(await controller.ConfirmPhoneChange(craftsman.Id, new ConfirmPhoneChangeRequest(challengeId, code!), CancellationToken.None));

        Assert.Equal("905551111111", craftsman.PhoneNumber);
        Assert.All(await db.CraftsmanSessions.ToListAsync(), session => Assert.NotNull(session.RevokedAtUtc));
        Assert.Single(await db.OutboxMessages.Where(x => x.Type == "CraftsmanNotification").ToListAsync());
    }

    private sealed class NoopSmsDelivery : ISmsDelivery
    {
        public Task SendOtpAsync(string phoneNumber, string code, CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class DevelopmentEnvironment : IWebHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "UstaEkosistemi.Api.Tests";
        public string WebRootPath { get; set; } = "";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = "";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
