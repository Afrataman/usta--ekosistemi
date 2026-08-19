using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UstaEkosistemi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDealerCouponFulfillment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ExpiresAtUtc",
                table: "RewardRedemptions",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FulfilledByDealerEmployeeId",
                table: "RewardRedemptions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Dealers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dealers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DealerEmployees",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DealerEmployees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DealerEmployees_Dealers_DealerId",
                        column: x => x.DealerId,
                        principalTable: "Dealers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RewardRedemptions_FulfilledByDealerEmployeeId",
                table: "RewardRedemptions",
                column: "FulfilledByDealerEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_DealerEmployees_DealerId_IsActive",
                table: "DealerEmployees",
                columns: new[] { "DealerId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_Dealers_Code",
                table: "Dealers",
                column: "Code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_RewardRedemptions_DealerEmployees_FulfilledByDealerEmployeeId",
                table: "RewardRedemptions",
                column: "FulfilledByDealerEmployeeId",
                principalTable: "DealerEmployees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RewardRedemptions_DealerEmployees_FulfilledByDealerEmployeeId",
                table: "RewardRedemptions");

            migrationBuilder.DropTable(
                name: "DealerEmployees");

            migrationBuilder.DropTable(
                name: "Dealers");

            migrationBuilder.DropIndex(
                name: "IX_RewardRedemptions_FulfilledByDealerEmployeeId",
                table: "RewardRedemptions");

            migrationBuilder.DropColumn(
                name: "ExpiresAtUtc",
                table: "RewardRedemptions");

            migrationBuilder.DropColumn(
                name: "FulfilledByDealerEmployeeId",
                table: "RewardRedemptions");
        }
    }
}
