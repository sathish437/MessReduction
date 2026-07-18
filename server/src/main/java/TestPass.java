import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

public class TestPass {
    public static void main(String[] args) {
        PasswordEncoder encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        try {
            boolean matches = encoder.matches("benigay", "{bcrypt}$2b$12$R8x7WCsu5tkqIYroononhOlQucFdxXCX9xViuQCvRydMqTl/xb/TS");
            System.out.println("Matches: " + matches);
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        System.out.println("Encoded benigay: " + encoder.encode("benigay"));
    }
}
