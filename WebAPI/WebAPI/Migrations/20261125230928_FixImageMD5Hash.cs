using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixImageMD5Hash : Migration
    {
        /// <inheritdoc />
        // Data-only migration: no schema change. ImageMD5Hash used to be computed with a randomly
        // keyed HMACMD5, so the stored values are meaningless. Recompute them as plain MD5 in the
        // same format EventImage.ComputeMD5Hash produces (32 lowercase hex chars). CONVERT style 2
        // renders binary as hex without a "0x" prefix.
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE Images SET ImageMD5Hash = LOWER(CONVERT(varchar(32), HASHBYTES('MD5', ImageBinary), 2));");
        }

        // Nothing to undo: the old values were random and can't (and needn't) be restored.
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
