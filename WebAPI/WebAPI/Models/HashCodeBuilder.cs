namespace WebAPI.Models
{
    class HashCodeBuilder
    {
        public int Hash { get; private set; } = 17;

        public HashCodeBuilder Add(object? obj)
        {
            // Note: Null values return a hash code of 0, so all that happens for null values is
            // (Hash * 29).
            Hash = (Hash * 29) + (obj?.GetHashCode()).GetValueOrDefault();

            return this;
        }
    }
}
