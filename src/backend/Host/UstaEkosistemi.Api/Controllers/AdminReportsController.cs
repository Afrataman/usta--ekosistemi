using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/reports")]
public sealed class AdminReportsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet("loyalty")]
    public async Task<IActionResult> GetLoyalty(DateOnly? from, DateOnly? to, CancellationToken token)
    {
        var range = GetRange(from, to);
        if (range is null) return ValidationProblem("Rapor aralığı en fazla 366 gün olabilir ve başlangıç bitişten sonra olamaz.");
        var (startsAt, endsAt) = range.Value;
        var entries = await dbContext.PointLedgerEntries.AsNoTracking().Where(x => x.CreatedAtUtc >= startsAt && x.CreatedAtUtc < endsAt)
            .Select(x => new { x.Amount, x.TransactionType, x.CreatedAtUtc, x.CraftsmanId, x.Craftsman.FullName, x.Craftsman.PhoneNumber }).ToListAsync(token);
        var redemptions = await dbContext.RewardRedemptions.AsNoTracking().Where(x => x.CreatedAtUtc >= startsAt && x.CreatedAtUtc < endsAt)
            .Select(x => new { x.PointsSpent, x.Status, x.Reward.Name }).ToListAsync(token);
        var daily = entries.GroupBy(x => DateOnly.FromDateTime(x.CreatedAtUtc.UtcDateTime)).OrderBy(x => x.Key).Select(x => new
        {
            date = x.Key, earned = x.Where(y => y.Amount > 0).Sum(y => y.Amount), spent = -x.Where(y => y.TransactionType == PointTransactionType.RewardRedeemed).Sum(y => y.Amount), reversed = -x.Where(y => y.TransactionType == PointTransactionType.ReturnReversal).Sum(y => y.Amount)
        });
        var topCraftsmen = entries.Where(x => x.Amount > 0).GroupBy(x => new { x.CraftsmanId, x.FullName, x.PhoneNumber }).Select(x => new { name = x.Key.FullName, phoneNumber = MaskPhone(x.Key.PhoneNumber), earnedPoints = x.Sum(y => y.Amount) }).OrderByDescending(x => x.earnedPoints).Take(10);
        var topRewards = redemptions.GroupBy(x => x.Name).Select(x => new { name = x.Key, count = x.Count(), points = x.Sum(y => y.PointsSpent) }).OrderByDescending(x => x.count).Take(10);
        return Ok(new { from = DateOnly.FromDateTime(startsAt.UtcDateTime), to = DateOnly.FromDateTime(endsAt.AddTicks(-1).UtcDateTime), summary = new { earnedPoints = entries.Where(x => x.Amount > 0).Sum(x => x.Amount), spentPoints = -entries.Where(x => x.TransactionType == PointTransactionType.RewardRedeemed).Sum(x => x.Amount), reversedPoints = -entries.Where(x => x.TransactionType == PointTransactionType.ReturnReversal).Sum(x => x.Amount), uniqueCraftsmen = entries.Select(x => x.CraftsmanId).Distinct().Count(), rewardRequests = redemptions.Count, fulfilledRewards = redemptions.Count(x => x.Status == RewardRedemptionStatus.Fulfilled) }, daily, topCraftsmen, topRewards });
    }

    [HttpGet("loyalty/export")]
    public async Task<IActionResult> ExportLoyalty(DateOnly? from, DateOnly? to, CancellationToken token)
    {
        var range = GetRange(from, to);
        if (range is null) return ValidationProblem("Geçersiz rapor aralığı.");
        var (startsAt, endsAt) = range.Value;
        var rows = await dbContext.PointLedgerEntries.AsNoTracking().Where(x => x.CreatedAtUtc >= startsAt && x.CreatedAtUtc < endsAt).OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new { x.CreatedAtUtc, x.TransactionType, x.Description, x.Amount, x.Craftsman.FullName, x.Craftsman.PhoneNumber, x.ReferenceType }).ToListAsync(token);
        var csv = new StringBuilder("Tarih;Islem;Aciklama;Puan;Usta;Telefon;Referans\r\n");
        foreach (var row in rows) csv.AppendLine(string.Join(';', Csv(row.CreatedAtUtc.ToString("O")), Csv(row.TransactionType.ToString()), Csv(row.Description), row.Amount, Csv(row.FullName), Csv(MaskPhone(row.PhoneNumber)), Csv(row.ReferenceType)));
        dbContext.ReportExportAudits.Add(new ReportExportAudit { ReportType = "Loyalty", Actor = "Demo Yönetici", StartsAtUtc = startsAt, EndsAtUtc = endsAt, RowCount = rows.Count });
        await dbContext.SaveChangesAsync(token);
        return File(Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv.ToString())).ToArray(), "text/csv; charset=utf-8", $"usta-kulubu-raporu-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    [HttpGet("exports")]
    public async Task<IActionResult> GetExports(CancellationToken token) => Ok(await dbContext.ReportExportAudits.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).Take(20).ToListAsync(token));

    private static (DateTimeOffset Start, DateTimeOffset End)? GetRange(DateOnly? from, DateOnly? to)
    {
        var endDate = to ?? DateOnly.FromDateTime(DateTime.UtcNow); var startDate = from ?? endDate.AddDays(-29);
        if (startDate > endDate || endDate.DayNumber - startDate.DayNumber > 365) return null;
        return (new DateTimeOffset(startDate.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero), new DateTimeOffset(endDate.AddDays(1).ToDateTime(TimeOnly.MinValue), TimeSpan.Zero));
    }
    private static string MaskPhone(string value) => value.Length < 7 ? "***" : $"{value[..3]} *** ** {value[^2..]}";
    private static string Csv(object? value) => $"\"{value?.ToString()?.Replace("\"", "\"\"")}\"";
}
