using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Loyalty;

public static class CampaignSelectionPolicy
{
    public static Campaign? SelectBest(IEnumerable<Campaign> campaigns, Guid productId, DateTimeOffset now)
    {
        return campaigns
            .Where(x => x.IsActive && x.StartsAtUtc <= now && x.EndsAtUtc > now && (x.ProductId is null || x.ProductId == productId))
            .OrderBy(x => x.DisplayOrder)
            .ThenByDescending(x => x.PointMultiplier)
            .ThenBy(x => x.Id)
            .FirstOrDefault();
    }
}
