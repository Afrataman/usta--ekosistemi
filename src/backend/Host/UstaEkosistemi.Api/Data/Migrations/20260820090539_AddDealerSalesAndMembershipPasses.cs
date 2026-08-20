using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UstaEkosistemi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDealerSalesAndMembershipPasses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MembershipPasses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CraftsmanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TokenHash = table.Column<string>(type: "nchar(64)", fixedLength: true, maxLength: 64, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ExpiresAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UsedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MembershipPasses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MembershipPasses_Craftsmen_CraftsmanId",
                        column: x => x.CraftsmanId,
                        principalTable: "Craftsmen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DealerSales",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealerEmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CraftsmanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MembershipPassId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SaleReference = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DealerSales", x => x.Id);
                    table.CheckConstraint("CK_DealerSales_TotalAmount", "[TotalAmount] >= 0");
                    table.ForeignKey(
                        name: "FK_DealerSales_Craftsmen_CraftsmanId",
                        column: x => x.CraftsmanId,
                        principalTable: "Craftsmen",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DealerSales_DealerEmployees_DealerEmployeeId",
                        column: x => x.DealerEmployeeId,
                        principalTable: "DealerEmployees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DealerSales_Dealers_DealerId",
                        column: x => x.DealerId,
                        principalTable: "Dealers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DealerSales_MembershipPasses_MembershipPassId",
                        column: x => x.MembershipPassId,
                        principalTable: "MembershipPasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DealerSales_CraftsmanId",
                table: "DealerSales",
                column: "CraftsmanId");

            migrationBuilder.CreateIndex(
                name: "IX_DealerSales_DealerEmployeeId",
                table: "DealerSales",
                column: "DealerEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_DealerSales_DealerId_SaleReference",
                table: "DealerSales",
                columns: new[] { "DealerId", "SaleReference" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DealerSales_MembershipPassId",
                table: "DealerSales",
                column: "MembershipPassId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MembershipPasses_CraftsmanId_ExpiresAtUtc",
                table: "MembershipPasses",
                columns: new[] { "CraftsmanId", "ExpiresAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_MembershipPasses_TokenHash",
                table: "MembershipPasses",
                column: "TokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DealerSales");

            migrationBuilder.DropTable(
                name: "MembershipPasses");
        }
    }
}
