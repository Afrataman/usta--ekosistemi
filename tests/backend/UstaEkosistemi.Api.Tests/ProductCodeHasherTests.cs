using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Tests;

public sealed class ProductCodeHasherTests
{
    [Fact]
    public void Hash_NormalizesWhitespaceAndLetterCase()
    {
        var first = ProductCodeHasher.Hash(" usta-abc-2026 ");
        var second = ProductCodeHasher.Hash("USTA-ABC-2026");

        Assert.Equal(first, second);
        Assert.Equal(64, first.Length);
    }

    [Fact]
    public void Hash_DoesNotStoreTheRawCode()
    {
        const string rawCode = "USTA-SECRET-2026";

        var hash = ProductCodeHasher.Hash(rawCode);

        Assert.DoesNotContain(rawCode, hash, StringComparison.OrdinalIgnoreCase);
    }
}
