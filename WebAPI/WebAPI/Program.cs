using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Newtonsoft.Json.Serialization;
using System.Security.Cryptography.X509Certificates;
using WebAPI.Exceptions;
using WebAPI.Models;


var builder = WebApplication.CreateBuilder(args);

const string tenantIdKey = "KeyVaultAccess:TenantId";
const string appIdKey = "KeyVaultAccess:HistoryProjectWebAppId";
const string vaultUriKey = "KeyVaultAccess:VaultUrl";
const string secretNameKey = "KeyVaultAccess:SecretNameLocalDbConnStr";

var tenantId = builder.Configuration.GetValue<String>(tenantIdKey) ?? throw new MissingKeyVaultAccessConfigException(tenantIdKey);
var appId = builder.Configuration.GetValue<String>(appIdKey) ?? throw new MissingKeyVaultAccessConfigException(appIdKey);
var vaultUri = builder.Configuration.GetValue<String>(vaultUriKey) ?? throw new MissingKeyVaultAccessConfigException(vaultUriKey);
var secretName = builder.Configuration.GetValue<String>(secretNameKey) ?? throw new MissingKeyVaultAccessConfigException(secretNameKey);

// Janky, but this is the way that I'm running the security during development. Only a machine
// with the cert installed can even attempt to access the key vault.
var certStore = new X509Store(StoreLocation.CurrentUser);
certStore.Open(OpenFlags.ReadOnly);

// Use "FindBySubjectName", which should perform a substring search of the subject name, not "FindBySubjectDistinguishedName", which will perform an exact string match of the subject name.
// Source:
//  https://learn.microsoft.com/en-us/dotnet/api/system.security.cryptography.x509certificates.x509certificate2.subjectname?view=net-8.0
//const string certCommonName = "historyprojectwebapp";
//var certsByName = certStore.Certificates.Find(X509FindType.FindBySubjectName, certCommonName, false);
const string certCommonName = "CN=historyprojectwebapp, O=Internet Widgits Pty Ltd, S=Some-State, C=AU";    // Still, cool that I figured this out.
var certsByName = certStore.Certificates.Find(X509FindType.FindBySubjectDistinguishedName, certCommonName, false);
if (certsByName.Count == 0)
{
    throw new MissingKeyVaultAccessCertException(certCommonName);
}
var cert = certsByName.First();

// Get the DB conn string from the key vault.
var loginCredential = new ClientCertificateCredential(tenantId, appId, cert);
var client = new SecretClient(new Uri(vaultUri), loginCredential);
var response = await client.GetSecretAsync(secretName);
var keyVaultSecret = response.Value;
var dbConnStr = keyVaultSecret.Value;

// Add services to the container.
builder.Services.AddDbContext<HistoryProjectDbContext>(options =>
{
    options.UseSqlServer(dbConnStr);
});

// Enable CORS (which is useful...how?)
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
    //app.UseExceptionHandler("/Error");
    //// The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    //app.UseHsts();
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(Directory.GetCurrentDirectory(), "Photos")),
    RequestPath = "/Photos"
});

app.MapControllers();

app.Run();
