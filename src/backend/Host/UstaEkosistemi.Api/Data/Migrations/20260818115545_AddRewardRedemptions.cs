using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UstaEkosistemi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRewardRedemptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RewardRedemptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CraftsmanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RewardId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PointsSpent = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    FulfillmentCode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    FulfilledAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RewardRedemptions", x => x.Id);
                    table.CheckConstraint("CK_RewardRedemptions_PointsSpent", "[PointsSpent] > 0");
                    table.ForeignKey(
                        name: "FK_RewardRedemptions_Craftsmen_CraftsmanId",
                        column: x => x.CraftsmanId,
                        principalTable: "Craftsmen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RewardRedemptions_Rewards_RewardId",
                        column: x => x.RewardId,
                        principalTable: "Rewards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RewardRedemptions_CraftsmanId_CreatedAtUtc",
                table: "RewardRedemptions",
                columns: new[] { "CraftsmanId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_RewardRedemptions_FulfillmentCode",
                table: "RewardRedemptions",
                column: "FulfillmentCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RewardRedemptions_RewardId",
                table: "RewardRedemptions",
                column: "RewardId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RewardRedemptions");
        }
    }
}
