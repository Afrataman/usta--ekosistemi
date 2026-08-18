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

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
