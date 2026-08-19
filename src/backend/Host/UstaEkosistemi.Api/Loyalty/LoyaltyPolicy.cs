using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Loyalty;

public static class LoyaltyPolicy
{
    public static CraftsmanLevel GetLevel(int qualifyingPoints, int silverThreshold = 5_000, int goldThreshold = 12_500) => qualifyingPoints switch
    {
        var points when points >= goldThreshold => CraftsmanLevel.Gold,
        var points when points >= silverThreshold => CraftsmanLevel.Silver,
        _ => CraftsmanLevel.Bronze
    };

    public static int PointsToNextLevel(int qualifyingPoints, int silverThreshold = 5_000, int goldThreshold = 12_500) => GetLevel(qualifyingPoints, silverThreshold, goldThreshold) switch
    {
        CraftsmanLevel.Bronze => silverThreshold - qualifyingPoints,
        CraftsmanLevel.Silver => goldThreshold - qualifyingPoints,
        _ => 0
    };
}
