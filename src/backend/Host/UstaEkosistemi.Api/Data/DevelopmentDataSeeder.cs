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
    public static readonly Guid DemoDealerId = Guid.Parse("77777777-7777-7777-7777-777777777771");
    public static readonly Guid DemoDealerEmployeeId = Guid.Parse("77777777-7777-7777-7777-777777777772");
    public static readonly Guid DemoAdminId = Guid.Parse("99999999-9999-9999-9999-999999999991");
    public static readonly Guid DemoApproverId = Guid.Parse("99999999-9999-9999-9999-999999999992");

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

        if (!await dbContext.Campaigns.AnyAsync(cancellationToken))
        {
            var now = DateTimeOffset.UtcNow;
            dbContext.Campaigns.AddRange(
                new Campaign { Id = Guid.Parse("66666666-6666-6666-6666-666666666661"), Title = "Ağustos Çifte Puan", Summary = "Seçili ürün kodlarında puanlar iki kat değerinde.", PointMultiplier = 2, StartsAtUtc = now.AddDays(-5), EndsAtUtc = now.AddDays(25), DisplayOrder = 1 },
                new Campaign { Id = Guid.Parse("66666666-6666-6666-6666-666666666662"), Title = "İlk Ödül Fırsatı", Summary = "İlk ödülünü alan ustalara özel avantajlı katalog.", PointMultiplier = 1, StartsAtUtc = now.AddDays(-5), EndsAtUtc = now.AddDays(55), DisplayOrder = 2 });
        }

        if (!await dbContext.Dealers.AnyAsync(x => x.Id == DemoDealerId, cancellationToken))
        {
            dbContext.Dealers.Add(new Dealer { Id = DemoDealerId, Code = "YLV-001", Name = "Yalova Merkez Bayi" });
            dbContext.DealerEmployees.Add(new DealerEmployee { Id = DemoDealerEmployeeId, DealerId = DemoDealerId, FullName = "Demo Bayi Görevlisi" });
        }

        var demoEmployee = await dbContext.DealerEmployees.SingleOrDefaultAsync(x => x.Id == DemoDealerEmployeeId, cancellationToken) ?? dbContext.DealerEmployees.Local.SingleOrDefault(x => x.Id == DemoDealerEmployeeId);
        if (demoEmployee is not null && string.IsNullOrWhiteSpace(demoEmployee.PinHash)) { var pin = OtpCodeHasher.Hash("123456"); demoEmployee.PinHash = pin.Hash; demoEmployee.PinSalt = pin.Salt; }

        if (!await dbContext.LoyaltyConfigurations.AnyAsync(x => x.Id == LoyaltyConfiguration.DefaultId, cancellationToken))
        {
            dbContext.LoyaltyConfigurations.Add(new LoyaltyConfiguration());
        }

        if (!await dbContext.AdminUsers.AnyAsync(x => x.Id == DemoAdminId, cancellationToken)) { var password = OtpCodeHasher.Hash("Usta2026!"); dbContext.AdminUsers.Add(new AdminUser { Id = DemoAdminId, UserName = "admin", FullName = "Demo Yönetici", PasswordHash = password.Hash, PasswordSalt = password.Salt }); }
        if (!await dbContext.AdminUsers.AnyAsync(x => x.Id == DemoApproverId, cancellationToken)) { var password = OtpCodeHasher.Hash("Usta2026!"); dbContext.AdminUsers.Add(new AdminUser { Id = DemoApproverId, UserName = "onayci", FullName = "Demo Onay Yetkilisi", Role = "Approver", PasswordHash = password.Hash, PasswordSalt = password.Salt }); }

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
