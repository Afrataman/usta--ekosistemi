using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/products")]
public sealed class ProductsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateProductRequest request, CancellationToken cancellationToken)
    {
        var sku = request.Sku.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(sku) || string.IsNullOrWhiteSpace(request.Name) || request.BasePoints <= 0)
        {
            return ValidationProblem("SKU, ürün adı ve sıfırdan büyük puan değeri zorunludur.");
        }

        if (await dbContext.Products.AnyAsync(x => x.Sku == sku, cancellationToken))
        {
            return Conflict(new { message = "Bu SKU ile kayıtlı ürün zaten var." });
        }

        var product = new Product { Sku = sku, Name = request.Name.Trim(), BasePoints = request.BasePoints };
        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Created($"/api/products/{product.Id}", new { product.Id, product.Sku, product.Name, product.BasePoints });
    }

    [HttpPost("{productId:guid}/codes")]
    public async Task<IActionResult> AddCode(Guid productId, AddProductCodeRequest request, CancellationToken cancellationToken)
    {
        if (!await dbContext.Products.AnyAsync(x => x.Id == productId && x.IsActive, cancellationToken))
        {
            return NotFound(new { message = "Aktif ürün bulunamadı." });
        }

        if (string.IsNullOrWhiteSpace(request.Code) || request.Code.Trim().Length < 8)
        {
            return ValidationProblem("Ürün kodu en az 8 karakter olmalıdır.");
        }

        var codeHash = ProductCodeHasher.Hash(request.Code);
        if (await dbContext.ProductCodes.AnyAsync(x => x.CodeHash == codeHash, cancellationToken))
        {
            return Conflict(new { message = "Bu ürün kodu daha önce yüklenmiş." });
        }

        var productCode = new ProductCode { ProductId = productId, CodeHash = codeHash };
        dbContext.ProductCodes.Add(productCode);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Created($"/api/product-codes/{productCode.Id}", new { productCode.Id, productCode.Status });
    }
}

public sealed record CreateProductRequest(string Sku, string Name, int BasePoints);
public sealed record AddProductCodeRequest(string Code);
