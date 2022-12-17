using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAPI.Migrations
{
    public partial class AddedTitleTextModel : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Title",
                table: "Events");

            migrationBuilder.AddColumn<Guid>(
                name: "TitleId",
                table: "Events",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "TitleTexts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Previous = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TitleTexts", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Events_TitleId",
                table: "Events",
                column: "TitleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_TitleTexts_TitleId",
                table: "Events",
                column: "TitleId",
                principalTable: "TitleTexts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_TitleTexts_TitleId",
                table: "Events");

            migrationBuilder.DropTable(
                name: "TitleTexts");

            migrationBuilder.DropIndex(
                name: "IX_Events_TitleId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "TitleId",
                table: "Events");

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "Events",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
