using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Data;

public sealed class UstaEkosistemiDbContext(DbContextOptions<UstaEkosistemiDbContext> options)
    : DbContext(options)
{
    public DbSet<Craftsman> Craftsmen => Set<Craftsman>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductCode> ProductCodes => Set<ProductCode>();
    public DbSet<PointLedgerEntry> PointLedgerEntries => Set<PointLedgerEntry>();
    public DbSet<Reward> Rewards => Set<Reward>();
    public DbSet<RewardRedemption> RewardRedemptions => Set<RewardRedemption>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<SupportRequest> SupportRequests => Set<SupportRequest>();
    public DbSet<SupportResponse> SupportResponses => Set<SupportResponse>();
    public DbSet<OtpChallenge> OtpChallenges => Set<OtpChallenge>();
    public DbSet<Dealer> Dealers => Set<Dealer>();
    public DbSet<DealerEmployee> DealerEmployees => Set<DealerEmployee>();
    public DbSet<DealerSession> DealerSessions => Set<DealerSession>();
    public DbSet<RiskCase> RiskCases => Set<RiskCase>();
    public DbSet<RewardAuditEntry> RewardAuditEntries => Set<RewardAuditEntry>();
    public DbSet<LoyaltyConfiguration> LoyaltyConfigurations => Set<LoyaltyConfiguration>();
    public DbSet<LoyaltyConfigurationAudit> LoyaltyConfigurationAudits => Set<LoyaltyConfigurationAudit>();
    public DbSet<ReportExportAudit> ReportExportAudits => Set<ReportExportAudit>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<AdminSession> AdminSessions => Set<AdminSession>();
    public DbSet<MembershipPass> MembershipPasses => Set<MembershipPass>();
    public DbSet<DealerSale> DealerSales => Set<DealerSale>();
    public DbSet<CraftsmanNotification> CraftsmanNotifications => Set<CraftsmanNotification>();
    public DbSet<CraftsmanSession> CraftsmanSessions => Set<CraftsmanSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Craftsman>(entity =>
        {
            entity.ToTable("Craftsmen");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired();
            entity.HasIndex(x => x.PhoneNumber).IsUnique();
            entity.Property(x => x.FullName).HasMaxLength(120).IsRequired();
            entity.Property(x => x.City).HasMaxLength(80);
            entity.Property(x => x.Level).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("Products", table => table.HasCheckConstraint("CK_Products_BasePoints", "[BasePoints] >= 0"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Sku).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => x.Sku).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
        });

        modelBuilder.Entity<ProductCode>(entity =>
        {
            entity.ToTable("ProductCodes");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CodeHash).HasMaxLength(64).IsFixedLength().IsRequired();
            entity.HasIndex(x => x.CodeHash).IsUnique();
            entity.HasIndex(x => x.RedemptionRequestId).IsUnique().HasFilter("[RedemptionRequestId] IS NOT NULL");
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(x => x.ReturnReason).HasMaxLength(240);
            entity.HasOne(x => x.Product).WithMany(x => x.Codes).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.RedeemedByCraftsman).WithMany().HasForeignKey(x => x.RedeemedByCraftsmanId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ReturnedByDealerEmployee).WithMany().HasForeignKey(x => x.ReturnedByDealerEmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PointLedgerEntry>(entity =>
        {
            entity.ToTable("PointLedgerEntries", table => table.HasCheckConstraint("CK_PointLedgerEntries_Amount", "[Amount] <> 0"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.TransactionType).HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.ReferenceType).HasMaxLength(40).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(240).IsRequired();
            entity.HasIndex(x => new { x.CraftsmanId, x.CreatedAtUtc });
            entity.HasIndex(x => new { x.ReferenceType, x.ReferenceId, x.TransactionType }).IsUnique();
            entity.HasOne(x => x.Craftsman).WithMany(x => x.PointLedgerEntries).HasForeignKey(x => x.CraftsmanId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Reward>(entity =>
        {
            entity.ToTable("Rewards", table =>
            {
                table.HasCheckConstraint("CK_Rewards_PointCost", "[PointCost] > 0");
                table.HasCheckConstraint("CK_Rewards_StockQuantity", "[StockQuantity] IS NULL OR [StockQuantity] >= 0");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(400).IsRequired();
            entity.Property(x => x.DeliveryType).HasConversion<string>().HasMaxLength(20);
            entity.Property(x => x.ImageKey).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => new { x.IsActive, x.DisplayOrder });
        });

        modelBuilder.Entity<RewardRedemption>(entity =>
        {
            entity.ToTable("RewardRedemptions", table => table.HasCheckConstraint("CK_RewardRedemptions_PointsSpent", "[PointsSpent] > 0"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(x => x.FulfillmentCode).HasMaxLength(30).IsRequired();
            entity.HasIndex(x => x.FulfillmentCode).IsUnique();
            entity.HasIndex(x => new { x.CraftsmanId, x.CreatedAtUtc });
            entity.HasOne(x => x.Craftsman).WithMany().HasForeignKey(x => x.CraftsmanId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Reward).WithMany().HasForeignKey(x => x.RewardId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.FulfilledByDealerEmployee).WithMany().HasForeignKey(x => x.FulfilledByDealerEmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Dealer>(entity =>
        {
            entity.ToTable("Dealers"); entity.HasKey(x => x.Id); entity.Property(x => x.Code).HasMaxLength(30).IsRequired(); entity.HasIndex(x => x.Code).IsUnique(); entity.Property(x => x.Name).HasMaxLength(160).IsRequired();
        });

        modelBuilder.Entity<DealerEmployee>(entity =>
        {
            entity.ToTable("DealerEmployees"); entity.HasKey(x => x.Id); entity.Property(x => x.FullName).HasMaxLength(120).IsRequired(); entity.Property(x => x.PinHash).HasMaxLength(100); entity.Property(x => x.PinSalt).HasMaxLength(50); entity.HasIndex(x => new { x.DealerId, x.IsActive }); entity.HasOne(x => x.Dealer).WithMany(x => x.Employees).HasForeignKey(x => x.DealerId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DealerSession>(entity =>
        {
            entity.ToTable("DealerSessions"); entity.HasKey(x => x.Id); entity.Property(x => x.TokenHash).HasMaxLength(64).IsFixedLength().IsRequired(); entity.HasIndex(x => x.TokenHash).IsUnique(); entity.HasIndex(x => new { x.DealerEmployeeId, x.ExpiresAtUtc }); entity.HasOne(x => x.DealerEmployee).WithMany(x => x.Sessions).HasForeignKey(x => x.DealerEmployeeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RiskCase>(entity =>
        {
            entity.ToTable("RiskCases"); entity.HasKey(x => x.Id); entity.Property(x => x.ReferenceType).HasMaxLength(30).IsRequired(); entity.Property(x => x.ReferenceValue).HasMaxLength(120).IsRequired(); entity.Property(x => x.Reason).HasMaxLength(80).IsRequired(); entity.Property(x => x.Description).HasMaxLength(1000).IsRequired(); entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(20); entity.HasIndex(x => new { x.Status, x.CreatedAtUtc }); entity.HasOne(x => x.ReportedByDealerEmployee).WithMany().HasForeignKey(x => x.ReportedByDealerEmployeeId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RewardAuditEntry>(entity =>
        {
            entity.ToTable("RewardAuditEntries"); entity.HasKey(x => x.Id); entity.Property(x => x.Action).HasMaxLength(40).IsRequired(); entity.Property(x => x.Details).HasMaxLength(600).IsRequired(); entity.HasIndex(x => new { x.RewardId, x.CreatedAtUtc }); entity.HasOne(x => x.Reward).WithMany().HasForeignKey(x => x.RewardId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LoyaltyConfiguration>(entity =>
        {
            entity.ToTable("LoyaltyConfigurations", table => { table.HasCheckConstraint("CK_LoyaltyConfiguration_Thresholds", "[SilverThreshold] > 0 AND [GoldThreshold] > [SilverThreshold]"); table.HasCheckConstraint("CK_LoyaltyConfiguration_ValueRate", "[PointsPerRewardTry] > 0"); }); entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<LoyaltyConfigurationAudit>(entity =>
        {
            entity.ToTable("LoyaltyConfigurationAudits"); entity.HasKey(x => x.Id); entity.Property(x => x.ChangeNote).HasMaxLength(300).IsRequired(); entity.HasIndex(x => x.CreatedAtUtc);
        });

        modelBuilder.Entity<Campaign>(entity =>
        {
            entity.ToTable("Campaigns", table => table.HasCheckConstraint("CK_Campaigns_Dates", "[EndsAtUtc] > [StartsAtUtc]"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(140).IsRequired();
            entity.Property(x => x.Summary).HasMaxLength(500).IsRequired();
            entity.Property(x => x.PointMultiplier).HasPrecision(5, 2);
            entity.HasIndex(x => new { x.IsActive, x.StartsAtUtc, x.EndsAtUtc });
        });

        modelBuilder.Entity<SupportRequest>(entity =>
        {
            entity.ToTable("SupportRequests");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Category).HasMaxLength(40).IsRequired();
            entity.Property(x => x.Subject).HasMaxLength(140).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(1500).IsRequired();
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(x => x.Priority).HasConversion<string>().HasMaxLength(20);
            entity.Property(x => x.AssignedTo).HasMaxLength(120);
            entity.HasIndex(x => new { x.CraftsmanId, x.CreatedAtUtc });
            entity.HasOne(x => x.Craftsman).WithMany().HasForeignKey(x => x.CraftsmanId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SupportResponse>(entity =>
        {
            entity.ToTable("SupportResponses"); entity.HasKey(x => x.Id); entity.Property(x => x.Author).HasMaxLength(120).IsRequired(); entity.Property(x => x.Message).HasMaxLength(1500).IsRequired(); entity.HasIndex(x => new { x.SupportRequestId, x.CreatedAtUtc }); entity.HasOne(x => x.SupportRequest).WithMany(x => x.Responses).HasForeignKey(x => x.SupportRequestId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OtpChallenge>(entity =>
        {
            entity.ToTable("OtpChallenges");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired();
            entity.Property(x => x.CodeHash).HasMaxLength(100).IsRequired();
            entity.Property(x => x.CodeSalt).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => new { x.PhoneNumber, x.CreatedAtUtc });
        });

        modelBuilder.Entity<ReportExportAudit>(entity =>
        {
            entity.ToTable("ReportExportAudits"); entity.HasKey(x => x.Id); entity.Property(x => x.ReportType).HasMaxLength(50).IsRequired(); entity.Property(x => x.Actor).HasMaxLength(120).IsRequired(); entity.HasIndex(x => x.CreatedAtUtc);
        });

        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.ToTable("AdminUsers"); entity.HasKey(x => x.Id); entity.Property(x => x.UserName).HasMaxLength(80).IsRequired(); entity.HasIndex(x => x.UserName).IsUnique(); entity.Property(x => x.FullName).HasMaxLength(120).IsRequired(); entity.Property(x => x.PasswordHash).HasMaxLength(100).IsRequired(); entity.Property(x => x.PasswordSalt).HasMaxLength(50).IsRequired(); entity.Property(x => x.Role).HasMaxLength(30).IsRequired();
        });
        modelBuilder.Entity<AdminSession>(entity =>
        {
            entity.ToTable("AdminSessions"); entity.HasKey(x => x.Id); entity.Property(x => x.TokenHash).HasMaxLength(64).IsFixedLength().IsRequired(); entity.HasIndex(x => x.TokenHash).IsUnique(); entity.HasIndex(x => new { x.AdminUserId, x.ExpiresAtUtc }); entity.HasOne(x => x.AdminUser).WithMany(x => x.Sessions).HasForeignKey(x => x.AdminUserId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<MembershipPass>(entity =>
        {
            entity.ToTable("MembershipPasses"); entity.HasKey(x => x.Id); entity.Property(x => x.TokenHash).HasMaxLength(64).IsFixedLength().IsRequired(); entity.HasIndex(x => x.TokenHash).IsUnique(); entity.HasIndex(x => new { x.CraftsmanId, x.ExpiresAtUtc }); entity.HasOne(x => x.Craftsman).WithMany().HasForeignKey(x => x.CraftsmanId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<DealerSale>(entity =>
        {
            entity.ToTable("DealerSales", table => table.HasCheckConstraint("CK_DealerSales_TotalAmount", "[TotalAmount] >= 0")); entity.HasKey(x => x.Id); entity.Property(x => x.SaleReference).HasMaxLength(80).IsRequired(); entity.Property(x => x.TotalAmount).HasPrecision(18, 2); entity.HasIndex(x => new { x.DealerId, x.SaleReference }).IsUnique(); entity.HasIndex(x => x.MembershipPassId).IsUnique(); entity.HasOne(x => x.Dealer).WithMany().HasForeignKey(x => x.DealerId).OnDelete(DeleteBehavior.Restrict); entity.HasOne(x => x.DealerEmployee).WithMany().HasForeignKey(x => x.DealerEmployeeId).OnDelete(DeleteBehavior.Restrict); entity.HasOne(x => x.Craftsman).WithMany().HasForeignKey(x => x.CraftsmanId).OnDelete(DeleteBehavior.Restrict); entity.HasOne(x => x.MembershipPass).WithMany().HasForeignKey(x => x.MembershipPassId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<CraftsmanNotification>(entity =>
        {
            entity.ToTable("CraftsmanNotifications"); entity.HasKey(x => x.Id); entity.Property(x => x.Type).HasMaxLength(30).IsRequired(); entity.Property(x => x.Title).HasMaxLength(140).IsRequired(); entity.Property(x => x.Message).HasMaxLength(500).IsRequired(); entity.Property(x => x.ReferenceType).HasMaxLength(40); entity.HasIndex(x => new { x.CraftsmanId, x.CreatedAtUtc }); entity.HasIndex(x => new { x.CraftsmanId, x.ReadAtUtc }); entity.HasOne(x => x.Craftsman).WithMany().HasForeignKey(x => x.CraftsmanId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<CraftsmanSession>(entity =>
        {
            entity.ToTable("CraftsmanSessions"); entity.HasKey(x => x.Id); entity.Property(x => x.TokenHash).HasMaxLength(64).IsFixedLength().IsRequired(); entity.HasIndex(x => x.TokenHash).IsUnique(); entity.HasIndex(x => new { x.CraftsmanId, x.ExpiresAtUtc }); entity.HasOne(x => x.Craftsman).WithMany().HasForeignKey(x => x.CraftsmanId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
