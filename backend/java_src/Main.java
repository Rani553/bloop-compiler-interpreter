import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {

        String sourceCode = "";

        try {
            // 🔥 Case 1: File input (old way)
            if (args.length == 1) {
                String filePath = args[0];
                sourceCode = new String(Files.readAllBytes(Paths.get(filePath)));
            }
            // 🔥 Case 2: Input from Flask (NEW)
            else {
                Scanner scanner = new Scanner(System.in);
                StringBuilder sb = new StringBuilder();

                while (scanner.hasNextLine()) {
                    sb.append(scanner.nextLine()).append("\n");
                }

                sourceCode = sb.toString();
            }

            // Run interpreter
            new Interpreter().run(sourceCode);

        } catch (IOException e) {
            System.err.println("File error: " + e.getMessage());
        } catch (RuntimeException e) {
            System.err.println("Runtime error: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
}