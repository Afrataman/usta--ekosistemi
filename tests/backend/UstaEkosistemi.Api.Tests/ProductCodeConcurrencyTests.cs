using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Tests;

public sealed class ProductCodeConcurrencyTests
{
    [Fact]
    public void Product_code_uses_sql_server_rowversion_for_concurrency_control()
    {
        var options = new DbContextOptionsBuilder<UstaEkosistemiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        using var db = new UstaEkosistemiDbContext(options);
        var property = db.Model.FindEntityType(typeof(ProductCode))!.FindProperty(nameof(ProductCode.RowVersion));

        Assert.NotNull(property);
        Assert.True(property!.IsConcurrencyToken);
        Assert.True(property.ValueGenerated == Microsoft.EntityFrameworkCore.Metadata.ValueGenerated.OnAddOrUpdate);
    }
}
