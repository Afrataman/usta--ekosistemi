using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/admin")]
public sealed class AdminManagementController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet("craftsmen")]
    public async Task<IActionResult> GetCraftsmen(CancellationToken token)
    {
        var items = await dbContext.Craftsmen.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).Select(x => new
        {
            x.Id, x.FullName, x.PhoneNumber, x.City, level = x.Level.ToString(), x.IsActive, x.CreatedAtUtc,
            balance = x.PointLedgerEntries.Sum(p => (int?)p.Amount) ?? 0
        }).ToListAsync(token);
        return Ok(items);
    }

    [HttpPatch("craftsmen/{id:guid}/active")]
    public async Task<IActionResult> SetCraftsmanActive(Guid id, SetActiveRequest request, CancellationToken token)
    {
        var item = await dbContext.Craftsmen.SingleOrDefaultAsync(x => x.Id == id, token);
        if (item is null) return NotFound(new { message = "Usta bulunamadı." });
        item.IsActive = request.IsActive; await dbContext.SaveChangesAsync(token);
        return Ok(new { item.Id, item.IsActive });
    }

    [HttpGet("dealers")]
    public async Task<IActionResult> GetDealers(CancellationToken token)
    {
        var items = await dbContext.Dealers.AsNoTracking().OrderBy(x => x.Name).Select(x => new
        {
            x.Id, x.Code, x.Name, x.IsActive,
            activeEmployees = x.Employees.Count(e => e.IsActive),
            totalEmployees = x.Employees.Count
        }).ToListAsync(token);
        return Ok(items);
    }

    [HttpPatch("dealers/{id:guid}/active")]
    public async Task<IActionResult> SetDealerActive(Guid id, SetActiveRequest request, CancellationToken token)
    {
        var item = await dbContext.Dealers.SingleOrDefaultAsync(x => x.Id == id, token);
        if (item is null) return NotFound(new { message = "Bayi bulunamadı." });
        item.IsActive = request.IsActive;
        if (!request.IsActive)
        {
            var now = DateTimeOffset.UtcNow;
            var sessions = await dbContext.DealerSessions.Where(x => x.DealerEmployee.DealerId == id && x.RevokedAtUtc == null && x.ExpiresAtUtc > now).ToListAsync(token);
            foreach (var session in sessions) session.RevokedAtUtc = now;
        }
        await dbContext.SaveChangesAsync(token);
        return Ok(new { item.Id, item.IsActive });
    }

    [HttpPost("dealers/onboard")]
    public async Task<IActionResult> OnboardDealer(OnboardDealerRequest request, CancellationToken token)
    {
        var code = request.Code.Trim().ToUpperInvariant(); var name = request.Name.Trim();
        if (code.Length is < 3 or > 30 || code.Any(character => !char.IsLetterOrDigit(character) && character != '-')) return ValidationProblem("Bayi kodu 3-30 karakter olmalı; yalnızca harf, rakam ve tire içermelidir.");
        if (name.Length is < 3 or > 160) return ValidationProblem("Bayi adı 3 ile 160 karakter arasında olmalıdır.");
        var employeeValidation = ValidateEmployee(new DealerEmployeeRequest(request.EmployeeFullName, request.EmployeePin)); if (employeeValidation is not null) return ValidationProblem(employeeValidation);
        if (await dbContext.Dealers.AnyAsync(x => x.Code == code, token)) return Conflict(new { message = "Bu bayi kodu daha önce kullanılmış." });
        var securedPin = OtpCodeHasher.Hash(request.EmployeePin);
        var dealer = new Dealer { Code = code, Name = name };
        var employee = new DealerEmployee { DealerId = dealer.Id, FullName = request.EmployeeFullName.Trim(), PinHash = securedPin.Hash, PinSalt = securedPin.Salt };
        dbContext.Dealers.Add(dealer); dbContext.DealerEmployees.Add(employee);
        await dbContext.SaveChangesAsync(token);
        return Created($"/api/admin/dealers/{dealer.Id}", new { dealer.Id, dealer.Code, dealer.Name, employeeId = employee.Id, employee = employee.FullName, warning = "Erişim kodunu yalnızca ilgili çalışana güvenli biçimde iletin." });
    }

    [HttpGet("dealers/{dealerId:guid}/employees")]
    public async Task<IActionResult> GetDealerEmployees(Guid dealerId, CancellationToken token)
    {
        if (!await dbContext.Dealers.AnyAsync(x => x.Id == dealerId, token)) return NotFound(new { message = "Bayi bulunamadı." });
        var items = await dbContext.DealerEmployees.AsNoTracking().Where(x => x.DealerId == dealerId).OrderBy(x => x.FullName)
            .Select(x => new { x.Id, x.DealerId, x.FullName, x.IsActive, hasAccessCode = x.PinHash != null, activeSessions = x.Sessions.Count(s => s.RevokedAtUtc == null && s.ExpiresAtUtc > DateTimeOffset.UtcNow) })
            .ToListAsync(token);
        return Ok(items);
    }

    [HttpPost("dealers/{dealerId:guid}/employees")]
    public async Task<IActionResult> CreateDealerEmployee(Guid dealerId, DealerEmployeeRequest request, CancellationToken token)
    {
        var dealer = await dbContext.Dealers.SingleOrDefaultAsync(x => x.Id == dealerId && x.IsActive, token);
        if (dealer is null) return NotFound(new { message = "Aktif bayi bulunamadı." });
        var validation = ValidateEmployee(request); if (validation is not null) return ValidationProblem(validation);
        if (await PinExists(dealerId, request.Pin, null, token)) return Conflict(new { message = "Bu çalışan kodu aynı bayide başka bir çalışana atanmış." });
        var securedPin = OtpCodeHasher.Hash(request.Pin);
        var employee = new DealerEmployee { DealerId = dealer.Id, FullName = request.FullName.Trim(), PinHash = securedPin.Hash, PinSalt = securedPin.Salt };
        dbContext.DealerEmployees.Add(employee); await dbContext.SaveChangesAsync(token);
        return Ok(new { employee.Id, employee.DealerId, employee.FullName, employee.IsActive, hasAccessCode = true });
    }

    [HttpPut("dealers/{dealerId:guid}/employees/{id:guid}/access-code")]
    public async Task<IActionResult> ResetDealerEmployeePin(Guid dealerId, Guid id, ResetEmployeePinRequest request, CancellationToken token)
    {
        if (!ValidPin(request.Pin)) return ValidationProblem("Çalışan kodu tam olarak 6 rakam olmalıdır.");
        var employee = await dbContext.DealerEmployees.SingleOrDefaultAsync(x => x.Id == id && x.DealerId == dealerId, token);
        if (employee is null) return NotFound(new { message = "Bayi çalışanı bulunamadı." });
        if (await PinExists(dealerId, request.Pin, id, token)) return Conflict(new { message = "Bu çalışan kodu aynı bayide başka bir çalışana atanmış." });
        var securedPin = OtpCodeHasher.Hash(request.Pin); employee.PinHash = securedPin.Hash; employee.PinSalt = securedPin.Salt;
        await RevokeSessions(id, token); await dbContext.SaveChangesAsync(token);
        return Ok(new { employee.Id, message = "Çalışan kodu yenilendi; açık oturumlar kapatıldı." });
    }

    [HttpPatch("dealers/{dealerId:guid}/employees/{id:guid}/active")]
    public async Task<IActionResult> SetDealerEmployeeActive(Guid dealerId, Guid id, SetActiveRequest request, CancellationToken token)
    {
        var employee = await dbContext.DealerEmployees.SingleOrDefaultAsync(x => x.Id == id && x.DealerId == dealerId, token);
        if (employee is null) return NotFound(new { message = "Bayi çalışanı bulunamadı." });
        employee.IsActive = request.IsActive; if (!request.IsActive) await RevokeSessions(id, token);
        await dbContext.SaveChangesAsync(token); return Ok(new { employee.Id, employee.IsActive });
    }

    private static string? ValidateEmployee(DealerEmployeeRequest request) => request.FullName.Trim().Length is < 3 or > 120 ? "Çalışan adı 3 ile 120 karakter arasında olmalıdır." : !ValidPin(request.Pin) ? "Çalışan kodu tam olarak 6 rakam olmalıdır." : null;
    private static bool ValidPin(string pin) => pin.Length == 6 && pin.All(char.IsDigit);
    private async Task<bool> PinExists(Guid dealerId, string pin, Guid? exceptId, CancellationToken token)
    {
        var credentials = await dbContext.DealerEmployees.AsNoTracking().Where(x => x.DealerId == dealerId && x.Id != exceptId && x.PinHash != null && x.PinSalt != null).Select(x => new { x.PinHash, x.PinSalt }).ToListAsync(token);
        return credentials.Any(x => OtpCodeHasher.Verify(pin, x.PinHash!, x.PinSalt!));
    }
    private async Task RevokeSessions(Guid employeeId, CancellationToken token)
    {
        var now = DateTimeOffset.UtcNow; var sessions = await dbContext.DealerSessions.Where(x => x.DealerEmployeeId == employeeId && x.RevokedAtUtc == null && x.ExpiresAtUtc > now).ToListAsync(token);
        foreach (var session in sessions) session.RevokedAtUtc = now;
    }
}

public sealed record SetActiveRequest(bool IsActive);
public sealed record DealerEmployeeRequest(string FullName, string Pin);
public sealed record ResetEmployeePinRequest(string Pin);
public sealed record OnboardDealerRequest(string Code, string Name, string EmployeeFullName, string EmployeePin);
