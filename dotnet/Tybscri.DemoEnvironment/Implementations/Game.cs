namespace Tybscri.DemoEnvironment;

internal class Game : IGame
{
    public void Log(string message) => Console.WriteLine($"[Log] {message}");
    public void ShowNotification(string title, string message) => Console.WriteLine($"[Notification] {title}: {message}");
}
