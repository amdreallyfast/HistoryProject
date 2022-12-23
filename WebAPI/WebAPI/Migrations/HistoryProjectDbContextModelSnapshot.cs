﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using WebAPI.Models;

#nullable disable

namespace WebAPI.Migrations
{
    [DbContext(typeof(HistoryProjectDbContext))]
    partial class HistoryProjectDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "6.0.9")
                .HasAnnotation("Relational:MaxIdentifierLength", 128);

            SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder, 1L, 1);

            modelBuilder.Entity("WebAPI.Models.EventLocation", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid?>("EventRegionId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<double>("Latitude")
                        .HasColumnType("float");

                    b.Property<double>("Longitude")
                        .HasColumnType("float");

                    b.HasKey("Id");

                    b.HasIndex("EventRegionId");

                    b.ToTable("Locations");
                });

            modelBuilder.Entity("WebAPI.Models.EventRegion", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.HasKey("Id");

                    b.ToTable("Regions");
                });

            modelBuilder.Entity("WebAPI.Models.EventSummary", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("Text")
                        .IsRequired()
                        .HasMaxLength(2048)
                        .HasColumnType("nvarchar(2048)");

                    b.HasKey("Id");

                    b.ToTable("Summaries");
                });

            modelBuilder.Entity("WebAPI.Models.EventTime", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<int?>("LowerBoundDay")
                        .HasColumnType("int");

                    b.Property<int?>("LowerBoundHour")
                        .HasColumnType("int");

                    b.Property<int?>("LowerBoundMin")
                        .HasColumnType("int");

                    b.Property<int?>("LowerBoundMonth")
                        .HasColumnType("int");

                    b.Property<int>("LowerBoundYear")
                        .HasColumnType("int");

                    b.Property<int?>("UpperBoundDay")
                        .HasColumnType("int");

                    b.Property<int?>("UpperBoundHour")
                        .HasColumnType("int");

                    b.Property<int?>("UpperBoundMin")
                        .HasColumnType("int");

                    b.Property<int?>("UpperBoundMonth")
                        .HasColumnType("int");

                    b.Property<int>("UpperBoundYear")
                        .HasColumnType("int");

                    b.HasKey("Id");

                    b.ToTable("TimeRanges");
                });

            modelBuilder.Entity("WebAPI.Models.HistoricalEvent", b =>
                {
                    b.Property<Guid>("RevisionId")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid>("EventId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("ImageFilePath")
                        .IsRequired()
                        .HasMaxLength(256)
                        .HasColumnType("nvarchar(256)");

                    b.Property<Guid>("RegionId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("RevisionAuthor")
                        .IsRequired()
                        .HasColumnType("nvarchar(max)");

                    b.Property<DateTime>("RevisionDateTime")
                        .HasColumnType("datetime2");

                    b.Property<Guid>("SummaryId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<Guid>("TimeRangeId")
                        .HasColumnType("uniqueidentifier");

                    b.Property<string>("Title")
                        .IsRequired()
                        .HasMaxLength(128)
                        .HasColumnType("nvarchar(128)");

                    b.HasKey("RevisionId");

                    b.HasIndex("RegionId");

                    b.HasIndex("SummaryId");

                    b.HasIndex("TimeRangeId");

                    b.ToTable("Events");
                });

            modelBuilder.Entity("WebAPI.Models.EventLocation", b =>
                {
                    b.HasOne("WebAPI.Models.EventRegion", null)
                        .WithMany("Locations")
                        .HasForeignKey("EventRegionId");
                });

            modelBuilder.Entity("WebAPI.Models.HistoricalEvent", b =>
                {
                    b.HasOne("WebAPI.Models.EventRegion", "Region")
                        .WithMany()
                        .HasForeignKey("RegionId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("WebAPI.Models.EventSummary", "Summary")
                        .WithMany()
                        .HasForeignKey("SummaryId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("WebAPI.Models.EventTime", "TimeRange")
                        .WithMany()
                        .HasForeignKey("TimeRangeId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Region");

                    b.Navigation("Summary");

                    b.Navigation("TimeRange");
                });

            modelBuilder.Entity("WebAPI.Models.EventRegion", b =>
                {
                    b.Navigation("Locations");
                });
#pragma warning restore 612, 618
        }
    }
}
