using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Security;

public static class AdminAuditExtensions
{
    public static void AddAdminAudit(this UstaEkosistemiDbContext dbContext, HttpContext context, string action, string entityType, Guid? entityId, string details)
    {
        if (context.Items["AdminUserId"] is not Guid adminUserId) return;
        dbContext.AdminAuditEntries.Add(new AdminAuditEntry
        {
            AdminUserId = adminUserId,
            Actor = context.Items["AdminName"]?.ToString() ?? "Yetkili yönetici",
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            Details = details.Length <= 1000 ? details : details[..1000]
        });
    }
}
