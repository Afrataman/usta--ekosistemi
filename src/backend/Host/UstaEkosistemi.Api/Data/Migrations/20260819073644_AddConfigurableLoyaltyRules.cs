using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UstaEkosistemi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddConfigurableLoyaltyRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LoyaltyConfigurationAudits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SilverThreshold = table.Column<int>(type: "int", nullable: false),
                    GoldThreshold = table.Column<int>(type: "int", nullable: false),
                    PointsPerRewardTry = table.Column<int>(type: "int", nullable: false),
                    ChangeNote = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyConfigurationAudits", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LoyaltyConfigurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SilverThreshold = table.Column<int>(type: "int", nullable: false),
                    GoldThreshold = table.Column<int>(type: "int", nullable: false),
                    PointsPerRewardTry = table.Column<int>(type: "int", nullable: false),
                    UpdatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoyaltyConfigurations", x => x.Id);
                    table.CheckConstraint("CK_LoyaltyConfiguration_Thresholds", "[SilverThreshold] > 0 AND [GoldThreshold] > [SilverThreshold]");
                    table.CheckConstraint("CK_LoyaltyConfiguration_ValueRate", "[PointsPerRewardTry] > 0");
                });

            migrationBuilder.CreateIndex(
                name: "IX_LoyaltyConfigurationAudits_CreatedAtUtc",
                table: "LoyaltyConfigurationAudits",
                column: "CreatedAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LoyaltyConfigurationAudits");

            migrationBuilder.DropTable(
                name: "LoyaltyConfigurations");
        }
    }
}
