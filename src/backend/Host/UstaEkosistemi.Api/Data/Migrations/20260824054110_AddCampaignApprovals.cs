using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UstaEkosistemi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCampaignApprovals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CampaignApprovals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CampaignId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedByAdminUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DecidedByAdminUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RequestedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    DecidedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DecisionNote = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignApprovals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CampaignApprovals_AdminUsers_DecidedByAdminUserId",
                        column: x => x.DecidedByAdminUserId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CampaignApprovals_AdminUsers_RequestedByAdminUserId",
                        column: x => x.RequestedByAdminUserId,
                        principalTable: "AdminUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CampaignApprovals_Campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CampaignApprovals_CampaignId",
                table: "CampaignApprovals",
                column: "CampaignId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CampaignApprovals_DecidedByAdminUserId",
                table: "CampaignApprovals",
                column: "DecidedByAdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignApprovals_RequestedByAdminUserId",
                table: "CampaignApprovals",
                column: "RequestedByAdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignApprovals_Status_RequestedAtUtc",
                table: "CampaignApprovals",
                columns: new[] { "Status", "RequestedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CampaignApprovals");
        }
    }
}
