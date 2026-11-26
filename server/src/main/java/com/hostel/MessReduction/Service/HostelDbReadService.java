package com.hostel.MessReduction.Service;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class HostelDbReadService {

    private static final Logger logger = LoggerFactory.getLogger(HostelDbReadService.class);

    public record HostelUserRecord(
            String id,
            String name,
            Long registerNumber,
            String email,
            String password,
            String role,
            Boolean isEnabled,
            String dept,
            Integer year,
            String gender
    ) {}

    private final HikariDataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public HostelDbReadService(
            @Value("${app.hostel.db-url:}") String dbUrl,
            @Value("${app.hostel.db-username:}") String dbUsername,
            @Value("${app.hostel.db-password:}") String dbPassword
    ) {
        if (dbUrl != null && !dbUrl.isBlank()) {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(dbUrl.trim());
            if (dbUsername != null && !dbUsername.isBlank()) {
                config.setUsername(dbUsername.trim());
            }
            if (dbPassword != null && !dbPassword.isBlank()) {
                config.setPassword(dbPassword);
            }
            config.setReadOnly(true);
            config.setMaximumPoolSize(3);
            config.setMinimumIdle(0);
            config.setPoolName("hosteldb-readonly");
            this.dataSource = new HikariDataSource(config);
            this.jdbcTemplate = new JdbcTemplate(this.dataSource);
            logger.info("HostelDbReadService initialized for direct read-only hosteldb access.");
        } else {
            this.dataSource = null;
            this.jdbcTemplate = null;
        }
    }

    public boolean isConfigured() {
        return jdbcTemplate != null;
    }

    public Optional<HostelUserRecord> findByIdentifier(String identifier) {
        if (jdbcTemplate == null || identifier == null || identifier.isBlank()) {
            return Optional.empty();
        }
        String trimmed = identifier.trim();
        Long numericReg = null;
        try {
            numericReg = Long.parseLong(trimmed);
        } catch (NumberFormatException ignored) {
        }

        String sql = numericReg != null
                ? """
                  SELECT u.id, u.name, u.register_number, u.email, u.password, u.role, u.is_enabled,
                         s.dept, s.year, s.gender
                  FROM users u
                  LEFT JOIN students s ON s.user_id = u.id
                  WHERE u.register_number = ? OR LOWER(u.id) = LOWER(?)
                  LIMIT 1
                  """
                : """
                  SELECT u.id, u.name, u.register_number, u.email, u.password, u.role, u.is_enabled,
                         s.dept, s.year, s.gender
                  FROM users u
                  LEFT JOIN students s ON s.user_id = u.id
                  WHERE LOWER(u.id) = LOWER(?) OR LOWER(u.email) = LOWER(?)
                  LIMIT 1
                  """;

        Object[] params = numericReg != null
                ? new Object[]{numericReg, trimmed}
                : new Object[]{trimmed, trimmed};

        List<HostelUserRecord> rows = jdbcTemplate.query(sql, (rs, rowNum) -> {
            long regNumVal = rs.getLong("register_number");
            Long regNum = rs.wasNull() ? null : regNumVal;
            int yearVal = rs.getInt("year");
            Integer year = rs.wasNull() ? null : yearVal;
            Object enabledObj = rs.getObject("is_enabled");
            Boolean enabled = enabledObj instanceof Boolean b ? b : null;

            return new HostelUserRecord(
                    rs.getString("id"),
                    rs.getString("name"),
                    regNum,
                    rs.getString("email"),
                    rs.getString("password"),
                    rs.getString("role"),
                    enabled,
                    rs.getString("dept"),
                    year,
                    rs.getString("gender")
            );
        }, params);

        return rows.stream().findFirst();
    }

    @PreDestroy
    public void close() {
        if (dataSource != null) {
            dataSource.close();
        }
    }
}
