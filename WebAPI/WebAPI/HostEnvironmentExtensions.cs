namespace WebAPI;

internal static class HostEnvironmentExtensions
{
    // Azure App Service "historyprojectapi-testing" runs with ASPNETCORE_ENVIRONMENT=Testing.
    // Wrap the magic string so calling code reads naturally alongside IsDevelopment()/IsStaging().
    private const string TestingEnvironmentName = "Testing";

    public static bool IsTesting(this IHostEnvironment env)
        => env.IsEnvironment(TestingEnvironmentName);
}
