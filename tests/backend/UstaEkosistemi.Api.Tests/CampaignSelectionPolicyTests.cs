using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Loyalty;

namespace UstaEkosistemi.Api.Tests;

public sealed class CampaignSelectionPolicyTests
{
    [Fact]
    public void Selects_the_highest_priority_campaign_before_multiplier()
    {
        var now = DateTimeOffset.UtcNow;
        var campaigns = new[]
        {
            Campaign("lower-priority", 3, 2, now),
            Campaign("higher-priority", 1, 1.2m, now)
        };

        var selected = CampaignSelectionPolicy.SelectBest(campaigns, Guid.NewGuid(), now);

        Assert.Equal("higher-priority", selected?.Title);
    }

    [Fact]
    public void Uses_the_highest_multiplier_when_priority_is_equal()
    {
        var now = DateTimeOffset.UtcNow;
        var campaigns = new[]
        {
            Campaign("small", 1, 1.5m, now),
            Campaign("large", 1, 2m, now)
        };

        var selected = CampaignSelectionPolicy.SelectBest(campaigns, Guid.NewGuid(), now);

        Assert.Equal("large", selected?.Title);
    }

    [Fact]
    public void Ignores_inactive_expired_and_other_product_campaigns()
    {
        var now = DateTimeOffset.UtcNow;
        var productId = Guid.NewGuid();
        var campaigns = new[]
        {
            Campaign("inactive", 1, 10, now, isActive: false),
            Campaign("expired", 1, 9, now.AddDays(-2), endsAt: now.AddDays(-1)),
            Campaign("other-product", 1, 8, now, productId: Guid.NewGuid()),
            Campaign("valid", 2, 1.5m, now)
        };

        var selected = CampaignSelectionPolicy.SelectBest(campaigns, productId, now);

        Assert.Equal("valid", selected?.Title);
    }

    private static Campaign Campaign(string title, int displayOrder, decimal multiplier, DateTimeOffset startsAt, bool isActive = true, DateTimeOffset? endsAt = null, Guid? productId = null)
        => new() { Title = title, Summary = title, DisplayOrder = displayOrder, PointMultiplier = multiplier, StartsAtUtc = startsAt.AddMinutes(-1), EndsAtUtc = endsAt ?? startsAt.AddDays(1), IsActive = isActive, ProductId = productId };
}
