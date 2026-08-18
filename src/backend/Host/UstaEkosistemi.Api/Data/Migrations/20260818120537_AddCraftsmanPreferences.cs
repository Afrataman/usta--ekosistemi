using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UstaEkosistemi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddCraftsmanPreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CampaignNotificationsEnabled",
                table: "Craftsmen",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SmsNotificationsEnabled",
                table: "Craftsmen",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CampaignNotificationsEnabled",
                table: "Craftsmen");

            migrationBuilder.DropColumn(
                name: "SmsNotificationsEnabled",
                table: "Craftsmen");
        }
    }
}
