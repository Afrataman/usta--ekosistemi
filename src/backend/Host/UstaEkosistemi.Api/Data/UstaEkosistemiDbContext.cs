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
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            entity.HasOne(x => x.Product).WithMany(x => x.Codes).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.RedeemedByCraftsman).WithMany().HasForeignKey(x => x.RedeemedByCraftsmanId).OnDelete(DeleteBehavior.Restrict);
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
        });
    }
}
