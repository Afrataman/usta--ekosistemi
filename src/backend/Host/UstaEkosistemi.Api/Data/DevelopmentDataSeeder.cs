using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Data;

public static class DevelopmentDataSeeder
{
    public static readonly Guid DemoCraftsmanId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid OpeningBalanceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid DemoProductId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid DemoProductCodeId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    public const string DemoProductCode = "USTA-DEMO-2026";

    public static async Task EnsureCreatedAsync(UstaEkosistemiDbContext dbContext, CancellationToken cancellationToken)
    {
        if (!await dbContext.Craftsmen.AnyAsync(x => x.Id == DemoCraftsmanId, cancellationToken))
        {
            dbContext.Craftsmen.Add(new Craftsman
            {
                Id = DemoCraftsmanId,
                PhoneNumber = "05550000000",
                FullName = "Ahmet Usta",
                City = "Yalova",
                Level = CraftsmanLevel.Silver
            });
        }

        if (!await dbContext.PointLedgerEntries.AnyAsync(x => x.Id == OpeningBalanceId, cancellationToken))
        {
            dbContext.PointLedgerEntries.Add(new PointLedgerEntry
            {
                Id = OpeningBalanceId,
                CraftsmanId = DemoCraftsmanId,
                Amount = 10_000,
                TransactionType = PointTransactionType.ManualAdjustment,
                ReferenceType = "DevelopmentSeed",
                ReferenceId = OpeningBalanceId,
                Description = "Geliştirme ortamı açılış puanı"
            });
        }

        if (!await dbContext.Products.AnyAsync(x => x.Id == DemoProductId, cancellationToken))
        {
            dbContext.Products.Add(new Product
            {
                Id = DemoProductId,
                Sku = "DEMO-001",
                Name = "Profesyonel Yapıştırıcı",
                BasePoints = 600
            });
        }

        var demoCodeHash = ProductCodeHasher.Hash(DemoProductCode);
        if (!await dbContext.ProductCodes.AnyAsync(x => x.CodeHash == demoCodeHash, cancellationToken))
        {
            dbContext.ProductCodes.Add(new ProductCode
            {
                Id = DemoProductCodeId,
                ProductId = DemoProductId,
                CodeHash = demoCodeHash
            });
        }

        if (!await dbContext.Rewards.AnyAsync(cancellationToken))
        {
            dbContext.Rewards.AddRange(
                CreateReward("55555555-5555-5555-5555-555555555551", "Takım Çantası", "Dayanıklı profesyonel takım çantası", 2_500, RewardDeliveryType.DealerPickup, "tool-bag", 40, 1),
                CreateReward("55555555-5555-5555-5555-555555555552", "Akülü Matkap", "Profesyonel kullanıma uygun akülü matkap", 7_500, RewardDeliveryType.DealerPickup, "drill", 15, 2),
                CreateReward("55555555-5555-5555-5555-555555555553", "Usta Montu", "Çok cepli dayanıklı çalışma montu", 3_000, RewardDeliveryType.DealerPickup, "work-jacket", 60, 3),
                CreateReward("55555555-5555-5555-5555-555555555554", "Dijital Hediye Kodu", "Anında teslim edilen dijital alışveriş kodu", 1_500, RewardDeliveryType.Digital, "digital-gift", null, 4));
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static Reward CreateReward(string id, string name, string description, int pointCost, RewardDeliveryType deliveryType, string imageKey, int? stockQuantity, int displayOrder) => new()
    {
        Id = Guid.Parse(id),
        Name = name,
        Description = description,
        PointCost = pointCost,
        DeliveryType = deliveryType,
        ImageKey = imageKey,
        StockQuantity = stockQuantity,
        DisplayOrder = displayOrder
    };
}
