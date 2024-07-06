// I want to use a custom invocation of the base class, so suppress the warning telling
// me to use a primary constructor (which this is very similar to, but not what I need).
#pragma warning disable IDE0290

namespace WebAPI.Exceptions
{
    public class MissingKeyVaultAccessConfigException : Exception
    {
        public MissingKeyVaultAccessConfigException(string message)
            : base($"Missing key vault access configuration: '{message}'")
        {

        }
    }
}
