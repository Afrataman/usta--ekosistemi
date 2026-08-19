using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Loyalty;

public static class LoyaltyPolicy
{
    public const int SilverThreshold = 5_000;
    public const int GoldThreshold = 12_500;

    public static CraftsmanLevel GetLevel(int qualifyingPoints) => qualifyingPoints switch
    {
        >= GoldThreshold => CraftsmanLevel.Gold,
        >= SilverThreshold => CraftsmanLevel.Silver,
        _ => CraftsmanLevel.Bronze
    };

    public static int PointsToNextLevel(int qualifyingPoints) => GetLevel(qualifyingPoints) switch
    {
        CraftsmanLevel.Bronze => SilverThreshold - qualifyingPoints,
        CraftsmanLevel.Silver => GoldThreshold - qualifyingPoints,
        _ => 0
    };
}
