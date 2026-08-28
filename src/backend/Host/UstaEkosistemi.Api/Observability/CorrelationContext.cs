namespace UstaEkosistemi.Api.Observability;

public static class CorrelationContext
{
    private static readonly AsyncLocal<string?> CurrentValue = new();
    public static string? Current { get => CurrentValue.Value; set => CurrentValue.Value = value; }
}
