using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Tests;

public sealed class ProductCodeFormatTests
{
    [Theory]
    [InlineData("USTA-DEMO-2026")]
    [InlineData("USTA-URUN-ABC123456789")]
    public void Accepts_supported_product_code_formats(string code) => Assert.True(ProductCodeFormat.IsValid(code));

    [Theory]
    [InlineData("short")]
    [InlineData("USTA--DEMO-2026")]
    [InlineData("USTA-DEMO-")]
    [InlineData("USTA DEMO 2026")]
    public void Rejects_invalid_product_code_formats(string code) => Assert.False(ProductCodeFormat.IsValid(code));
}
