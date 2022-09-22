using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Newtonsoft.Json.Serialization;
using System.Security.Cryptography.X509Certificates;
using WebAPI.Models;

var builder = WebApplication.CreateBuilder(args);

var tenantId = builder.Configuration.GetValue<String>("KeyVaultAccess:TenantId");
var appId = builder.Configuration.GetValue<String>("KeyVaultAccess:AppId");
var vaultUri = builder.Configuration.GetValue<String>("KeyVaultAccess:VaultUrl");
var secretName = builder.Configuration.GetValue<String>("KeyVaultAccess:SecretName");

var certStore = new X509Store(StoreLocation.CurrentUser);
certStore.Open(OpenFlags.ReadOnly);
var certsByName = certStore.Certificates.Find(X509FindType.FindBySubjectName, "derblarglewhatever", false);
if (certsByName.Count == 0)
{
    throw new Exception("no certificate available");
}

var cert = certsByName.First();

var loginCredential = new ClientCertificateCredential(tenantId, appId, cert);
var client = new SecretClient(new Uri(vaultUri), loginCredential);
var response = await client.GetSecretAsync(secretName);
var rawResponse = response.GetRawResponse();
if (rawResponse.Status != 200)
{
    throw new Exception($"Could not get secret '{secretName}' from key vault. Response code: '{rawResponse.Status}', reason: '{rawResponse.ReasonPhrase}'");
}

var keyVaultSecret = response.Value;
var dbConnStr = keyVaultSecret.Value;

// Add services to the container.
// Entity Framework
builder.Services.AddDbContext<DataContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString(dbConnStr));
});

// Enable CORS
builder.Services.AddCors(corsOptions =>
{
    corsOptions.AddPolicy(name: "AllowOrigin", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

// JSON Serializer
builder.Services.AddControllersWithViews()
    .AddNewtonsoftJson(jsonOptions => jsonOptions.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore)
    .AddNewtonsoftJson(jsonOptions => jsonOptions.SerializerSettings.ContractResolver = new DefaultContractResolver());

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseCors(corsPolicyBuilder =>
{
    corsPolicyBuilder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), "Photos")),
    RequestPath = "/Photos"
});

app.Run();