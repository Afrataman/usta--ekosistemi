using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;

namespace UstaEkosistemi.Api.Security;

public static class AdminSessionSecurity
{
    public static string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}

public sealed class AdminAuthenticationMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, UstaEkosistemiDbContext dbContext)
    {
        if (!context.Request.Path.StartsWithSegments("/api/admin") || context.Request.Path.StartsWithSegments("/api/admin/auth")) { await next(context); return; }
        var authorization = context.Request.Headers.Authorization.ToString();
        if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) { await Unauthorized(context); return; }
        var hash = AdminSessionSecurity.HashToken(authorization[7..].Trim()); var now = DateTimeOffset.UtcNow;
        var user = await dbContext.AdminSessions.Where(x => x.TokenHash == hash && x.RevokedAtUtc == null && x.ExpiresAtUtc > now && x.AdminUser.IsActive).Select(x => new { x.AdminUserId, x.AdminUser.FullName, x.AdminUser.Role }).SingleOrDefaultAsync(context.RequestAborted);
        if (user is null) { await Unauthorized(context); return; }
        if (user.Role == "Approver" && !IsApproverRoute(context.Request)) { await Forbidden(context); return; }
        context.Items["AdminUserId"] = user.AdminUserId; context.Items["AdminName"] = user.FullName; context.Items["AdminRole"] = user.Role; await next(context);
    }
    private static bool IsApproverRoute(HttpRequest request)
    {
        var path = request.Path.Value ?? string.Empty;
        if (request.Method == HttpMethods.Get && path.StartsWith("/api/admin/campaigns", StringComparison.OrdinalIgnoreCase)) return true;
        return request.Method == HttpMethods.Post && path.StartsWith("/api/admin/campaigns/approvals/", StringComparison.OrdinalIgnoreCase) && (path.EndsWith("/approve", StringComparison.OrdinalIgnoreCase) || path.EndsWith("/reject", StringComparison.OrdinalIgnoreCase));
    }
    private static async Task Unauthorized(HttpContext context) { context.Response.StatusCode = StatusCodes.Status401Unauthorized; await context.Response.WriteAsJsonAsync(new { message = "Yönetici oturumu geçersiz veya süresi dolmuş." }); }
    private static async Task Forbidden(HttpContext context) { context.Response.StatusCode = StatusCodes.Status403Forbidden; await context.Response.WriteAsJsonAsync(new { message = "Bu işlem için yönetici yetkiniz yok." }); }
}
