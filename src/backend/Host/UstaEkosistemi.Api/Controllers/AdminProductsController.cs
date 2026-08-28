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

    [HttpPost("{id:guid}/validate-codes")]
    public async Task<IActionResult> ValidateCodes(Guid id, ImportProductCodesRequest request, CancellationToken token)
    {
        if (!await dbContext.Products.AnyAsync(x => x.Id == id && x.IsActive, token)) return NotFound(new { message = "Aktif ürün bulunamadı." });
        var result = await AnalyzeCodes(request.Codes, token);
        return Ok(new { total = result.Total, valid = result.Valid, rejected = result.Rejected.Count, rejectedItems = result.Rejected });
    }

    [HttpPost("{id:guid}/import-codes")]
    public async Task<IActionResult> ImportCodes(Guid id, ImportProductCodesRequest request, CancellationToken token)
    {
        var product = await dbContext.Products.SingleOrDefaultAsync(x => x.Id == id && x.IsActive, token); if (product is null) return NotFound(new { message = "Aktif ürün bulunamadı." });
        var result = await AnalyzeCodes(request.Codes, token);
        if (result.Rejected.Count > 0) return Conflict(new { message = "Dosyada geçersiz veya tekrar eden kodlar var. Önce doğrulama hatalarını düzeltin.", total = result.Total, valid = result.Valid, rejected = result.Rejected.Count, rejectedItems = result.Rejected });
        dbContext.ProductCodes.AddRange(result.Normalized.Select(code => new ProductCode { ProductId = product.Id, CodeHash = ProductCodeHasher.Hash(code) }));
        dbContext.AddAdminAudit(HttpContext, "ProductCodesImported", nameof(Product), product.Id, $"SKU={product.Sku}; yüklenen kod={result.Normalized.Count}");
        await dbContext.SaveChangesAsync(token);
        return Ok(new { product.Id, product.Sku, imported = result.Normalized.Count, warning = "Kodların açık değerleri saklanmadı; yalnızca güvenli özetleri kaydedildi." });
    }

    private async Task<CodeImportAnalysis> AnalyzeCodes(IReadOnlyList<string>? input, CancellationToken token)
    {
        if (input is null || input.Count is < 1 or > 5000) throw new BadHttpRequestException("Tek dosyada 1 ile 5.000 arasında kod bulunmalıdır.");
        var normalized = input.Select((code, index) => new { Line = index + 1, Code = code.Trim().ToUpperInvariant() }).ToList();
        var rejected = normalized.Where(x => x.Code.Length is < 8 or > 80 || x.Code.Any(character => !char.IsLetterOrDigit(character) && character != '-'))
            .Select(x => new CodeImportRejection(x.Line, Mask(x.Code), "Kod 8-80 karakter olmalı; yalnızca harf, rakam ve tire içermelidir.")).ToList();
        var syntacticallyValid = normalized.Where(x => !rejected.Any(r => r.Line == x.Line)).ToList();
        var duplicateLines = syntacticallyValid.GroupBy(x => x.Code).Where(group => group.Count() > 1).SelectMany(group => group.Skip(1)).ToList();
        rejected.AddRange(duplicateLines.Select(x => new CodeImportRejection(x.Line, Mask(x.Code), "Dosya içinde tekrarlanan kod.")));
        var candidates = syntacticallyValid.Where(x => !duplicateLines.Any(d => d.Line == x.Line)).ToList();
        var existingHashes = new HashSet<string>();
        foreach (var chunk in candidates.Select(x => ProductCodeHasher.Hash(x.Code)).Chunk(500))
        {
            var found = await dbContext.ProductCodes.AsNoTracking().Where(x => chunk.Contains(x.CodeHash)).Select(x => x.CodeHash).ToListAsync(token);
            existingHashes.UnionWith(found);
        }
        rejected.AddRange(candidates.Where(x => existingHashes.Contains(ProductCodeHasher.Hash(x.Code))).Select(x => new CodeImportRejection(x.Line, Mask(x.Code), "Kod daha önce sisteme yüklenmiş.")));
        var accepted = candidates.Where(x => !existingHashes.Contains(ProductCodeHasher.Hash(x.Code))).Select(x => x.Code).ToList();
        return new CodeImportAnalysis(normalized.Count, accepted.Count, accepted, rejected.OrderBy(x => x.Line).Take(100).ToList());
    }

    private static string Mask(string code) => code.Length <= 6 ? "***" : $"{code[..3]}…{code[^3..]}";

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, SetActiveRequest request, CancellationToken token)
    {
        var product = await dbContext.Products.SingleOrDefaultAsync(x => x.Id == id, token);
        if (product is null) return NotFound(new { message = "Ürün bulunamadı." });
        if (product.IsActive == request.IsActive) return Ok(new { product.Id, product.IsActive });
        product.IsActive = request.IsActive;
        dbContext.AddAdminAudit(HttpContext, request.IsActive ? "ProductActivated" : "ProductDeactivated", nameof(Product), product.Id, $"SKU={product.Sku}; durum={(request.IsActive ? "aktif" : "pasif")}");
        await dbContext.SaveChangesAsync(token);
        return Ok(new { product.Id, product.IsActive });
    }
}

public sealed record GenerateProductCodesRequest(int Count);
public sealed record ImportProductCodesRequest(IReadOnlyList<string> Codes);
public sealed record CodeImportRejection(int Line, string MaskedCode, string Reason);
public sealed record CodeImportAnalysis(int Total, int Valid, List<string> Normalized, List<CodeImportRejection> Rejected);
