namespace Server
{
    public static class NetworkExtentions
    {
        /// <summary>
        /// Remove quotes from string (example, for json string).
        /// </summary>
        /// <param name="Value">String with quotes.</param>
        /// <returns>String without quotes.</returns>
        public static string RemoveQuotes(this string Value)
        {
            return Value.Replace("\"", "");
        }
    }
}