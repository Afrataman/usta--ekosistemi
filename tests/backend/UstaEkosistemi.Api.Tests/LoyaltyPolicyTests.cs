using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Loyalty;

namespace UstaEkosistemi.Api.Tests;

public sealed class LoyaltyPolicyTests
{
    [Theory]
    [InlineData(0, CraftsmanLevel.Bronze)]
    [InlineData(4_999, CraftsmanLevel.Bronze)]
    [InlineData(5_000, CraftsmanLevel.Silver)]
    [InlineData(12_499, CraftsmanLevel.Silver)]
    [InlineData(12_500, CraftsmanLevel.Gold)]
    public void GetLevel_UsesPilotThresholds(int points, CraftsmanLevel expected) => Assert.Equal(expected, LoyaltyPolicy.GetLevel(points));

    [Fact]
    public void PointsToNextLevel_ReturnsZeroForGold() => Assert.Equal(0, LoyaltyPolicy.PointsToNextLevel(20_000));

    [Fact]
    public void GetLevel_UsesAdministratorThresholds() => Assert.Equal(CraftsmanLevel.Silver, LoyaltyPolicy.GetLevel(8_000, 7_500, 20_000));
}
