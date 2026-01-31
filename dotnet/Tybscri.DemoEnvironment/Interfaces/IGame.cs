namespace Tybscri.DemoEnvironment;

/// <summary>
/// Game controller for notifications and logging
/// </summary>
public interface IGame
{
    void Log(string message);
    void ShowNotification(string title, string message);
}
