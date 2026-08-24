using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using UstaEkosistemi.Api.Controllers;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Tests;

public sealed class IdempotentTransactionTests
{
    private readonly DbContextOptions<UstaEkosistemiDbContext> options;

    public IdempotentTransactionTests()
    {
        options = new DbContextOptionsBuilder<UstaEkosistemiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
    }

    [Fact]
    public async Task Redeeming_the_same_product_request_twice_creates_one_point_entry()
    {
        await using var db = new UstaEkosistemiDbContext(options);
        var craftsman = await SeedCraftsmanAsync(db, 0);
        var product = new Product { Sku = "TEST-QR", Name = "Test Ürünü", BasePoints = 250 };
        var code = new ProductCode { Product = product, CodeHash = ProductCodeHasher.Hash("TEST-QR-001") };
        db.AddRange(product, code); await db.SaveChangesAsync();
        var requestId = Guid.NewGuid();
        var controller = ProductController(db, craftsman.Id, "craft-token");

        Assert.IsType<OkObjectResult>(await controller.Redeem(new RedeemProductCodeRequest(craftsman.Id, "TEST-QR-001", requestId), CancellationToken.None));
        Assert.IsType<OkObjectResult>(await controller.Redeem(new RedeemProductCodeRequest(craftsman.Id, "TEST-QR-001", requestId), CancellationToken.None));

        Assert.Equal(1, await db.PointLedgerEntries.CountAsync(x => x.TransactionType == PointTransactionType.ProductCodeEarned));
        Assert.Equal(ProductCodeStatus.Redeemed, (await db.ProductCodes.SingleAsync()).Status);
    }

    [Fact]
    public async Task Redeeming_the_same_reward_request_twice_spends_points_once()
    {
        await using var db = new UstaEkosistemiDbContext(options);
        var craftsman = await SeedCraftsmanAsync(db, 2_000);
        var reward = new Reward { Name = "Dijital Test Kuponu", Description = "Test ödülü", PointCost = 1_500, DeliveryType = RewardDeliveryType.Digital, ImageKey = "digital-gift" };
        db.Rewards.Add(reward); await db.SaveChangesAsync();
        var requestId = Guid.NewGuid();
        var controller = RewardController(db, "craft-token");

        Assert.IsType<OkObjectResult>(await controller.Redeem(reward.Id, new RedeemRewardRequest(craftsman.Id, requestId), CancellationToken.None));
        Assert.IsType<OkObjectResult>(await controller.Redeem(reward.Id, new RedeemRewardRequest(craftsman.Id, requestId), CancellationToken.None));

        Assert.Equal(1, await db.RewardRedemptions.CountAsync());
        Assert.Equal(1, await db.PointLedgerEntries.CountAsync(x => x.TransactionType == PointTransactionType.RewardRedeemed));
    }

    [Fact]
    public async Task Returning_the_same_product_twice_reverses_points_once()
    {
        await using var db = new UstaEkosistemiDbContext(options);
        var craftsman = await SeedCraftsmanAsync(db, 0);
        var product = new Product { Sku = "TEST-RETURN", Name = "İade Test Ürünü", BasePoints = 250 };
        var code = new ProductCode { Product = product, CodeHash = ProductCodeHasher.Hash("TEST-RETURN-001"), Status = ProductCodeStatus.Redeemed, RedeemedByCraftsman = craftsman, RedeemedAtUtc = DateTimeOffset.UtcNow };
        db.AddRange(product, code);
        db.PointLedgerEntries.Add(new PointLedgerEntry { Craftsman = craftsman, Amount = 250, TransactionType = PointTransactionType.ProductCodeEarned, ReferenceType = nameof(ProductCode), ReferenceId = code.Id, Description = "İade test puanı" });
        var dealer = new Dealer { Code = "TEST-DEALER", Name = "Test Bayi" };
        var employee = new DealerEmployee { Dealer = dealer, FullName = "Test Çalışanı" };
        db.DealerSessions.Add(new DealerSession { DealerEmployee = employee, TokenHash = DealerSessionAuthenticator.HashToken("dealer-token"), ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(1) });
        await db.SaveChangesAsync();
        var controller = new ProductCodesController(db, new DealerSessionAuthenticator(db));
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        controller.Request.Headers.Authorization = "Bearer dealer-token";

        Assert.IsType<OkObjectResult>(await controller.Return(new ReturnProductCodeRequest("TEST-RETURN-001", "Test iadesi"), CancellationToken.None));
        Assert.IsType<OkObjectResult>(await controller.Return(new ReturnProductCodeRequest("TEST-RETURN-001", "Test iadesi"), CancellationToken.None));

        Assert.Equal(1, await db.PointLedgerEntries.CountAsync(x => x.TransactionType == PointTransactionType.ReturnReversal));
        Assert.Equal(ProductCodeStatus.Returned, (await db.ProductCodes.SingleAsync()).Status);
    }

    private static async Task<Craftsman> SeedCraftsmanAsync(UstaEkosistemiDbContext db, int openingPoints)
    {
        var craftsman = new Craftsman { PhoneNumber = $"90555{Guid.NewGuid():N}"[..13], FullName = "Test Ustası" };
        db.Craftsmen.Add(craftsman);
        db.LoyaltyConfigurations.Add(new LoyaltyConfiguration());
        if (openingPoints > 0) db.PointLedgerEntries.Add(new PointLedgerEntry { Craftsman = craftsman, Amount = openingPoints, TransactionType = PointTransactionType.ManualAdjustment, ReferenceType = "Test", ReferenceId = Guid.NewGuid(), Description = "Test açılış puanı" });
        db.CraftsmanSessions.Add(new CraftsmanSession { Craftsman = craftsman, TokenHash = CraftsmanSessionSecurity.HashToken("craft-token"), ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(1) });
        await db.SaveChangesAsync(); return craftsman;
    }

    private static ProductCodesController ProductController(UstaEkosistemiDbContext db, Guid craftsmanId, string token)
    {
        var controller = new ProductCodesController(db, new DealerSessionAuthenticator(db));
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        controller.Request.Headers.Authorization = $"Bearer {token}";
        return controller;
    }

    private static RewardsController RewardController(UstaEkosistemiDbContext db, string token)
    {
        var controller = new RewardsController(db);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };
        controller.Request.Headers.Authorization = $"Bearer {token}";
        return controller;
    }
}
