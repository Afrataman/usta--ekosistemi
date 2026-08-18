using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Data;

public static class DevelopmentDataSeeder
{
    public static readonly Guid DemoCraftsmanId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid OpeningBalanceId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    public static async Task EnsureCreatedAsync(UstaEkosistemiDbContext dbContext, CancellationToken cancellationToken)
    {
        if (await dbContext.Craftsmen.AnyAsync(x => x.Id == DemoCraftsmanId, cancellationToken))
        {
            return;
        }

        dbContext.Craftsmen.Add(new Craftsman
        {
            Id = DemoCraftsmanId,
            PhoneNumber = "05550000000",
            FullName = "Ahmet Usta",
            City = "Yalova",
            Level = CraftsmanLevel.Silver
        });
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
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
