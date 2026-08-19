using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin/products")]
public sealed class AdminProductsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken token) => Ok(await dbContext.Products.AsNoTracking().OrderBy(x => x.Name).Select(x => new
    {
        x.Id, x.Sku, x.Name, x.BasePoints, x.IsActive, x.CreatedAtUtc,
        totalCodes = x.Codes.Count,
        availableCodes = x.Codes.Count(c => c.Status == ProductCodeStatus.Available),
        redeemedCodes = x.Codes.Count(c => c.Status == ProductCodeStatus.Redeemed),
        returnedCodes = x.Codes.Count(c => c.Status == ProductCodeStatus.Returned)
    }).ToListAsync(token));

    [HttpPost]
    public async Task<IActionResult> Create(CreateProductRequest request, CancellationToken token)
    {
        var sku = request.Sku.Trim().ToUpperInvariant(); var name = request.Name.Trim();
        if (sku.Length is < 2 or > 50 || name.Length is < 3 or > 160 || request.BasePoints <= 0) return ValidationProblem("SKU, ürün adı veya puan değeri geçersiz.");
        if (await dbContext.Products.AnyAsync(x => x.Sku == sku, token)) return Conflict(new { message = "Bu SKU zaten kayıtlı." });
        var product = new Product { Sku = sku, Name = name, BasePoints = request.BasePoints }; dbContext.Products.Add(product); await dbContext.SaveChangesAsync(token);
        return Created($"/api/admin/products/{product.Id}", new { product.Id });
    }

    [HttpPost("{id:guid}/generate-codes")]
    public async Task<IActionResult> GenerateCodes(Guid id, GenerateProductCodesRequest request, CancellationToken token)
    {
        if (request.Count is < 1 or > 1000) return ValidationProblem("Tek işlemde 1 ile 1000 arasında kod üretilebilir.");
        var product = await dbContext.Products.SingleOrDefaultAsync(x => x.Id == id && x.IsActive, token); if (product is null) return NotFound(new { message = "Aktif ürün bulunamadı." });
        var prefix = new string(product.Sku.Where(char.IsLetterOrDigit).Take(6).ToArray()); var rawCodes = new List<string>(request.Count);
        for (var index = 0; index < request.Count; index++)
        {
            var raw = $"USTA-{prefix}-{Convert.ToHexString(RandomNumberGenerator.GetBytes(8))}"; rawCodes.Add(raw); dbContext.ProductCodes.Add(new ProductCode { ProductId = product.Id, CodeHash = ProductCodeHasher.Hash(raw) });
        }
        await dbContext.SaveChangesAsync(token);
        return Ok(new { product.Id, product.Sku, count = rawCodes.Count, codes = rawCodes, warning = "Bu kodlar daha sonra tekrar görüntülenemez. Güvenli bir dosyaya kaydedin." });
    }

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, SetActiveRequest request, CancellationToken token)
    {
        var product = await dbContext.Products.SingleOrDefaultAsync(x => x.Id == id, token); if (product is null) return NotFound(new { message = "Ürün bulunamadı." }); product.IsActive = request.IsActive; await dbContext.SaveChangesAsync(token); return Ok(new { product.Id, product.IsActive });
    }
}

public sealed record GenerateProductCodesRequest(int Count);
