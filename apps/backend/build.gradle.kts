plugins {
    kotlin("jvm") version "2.1.21"
    id("java-test-fixtures")
    kotlin("plugin.spring") version "2.1.21"
    id("org.springframework.boot") version "3.5.3"
    id("io.spring.dependency-management") version "1.1.7"
    kotlin("plugin.jpa") version "2.2.20"
    id("org.springdoc.openapi-gradle-plugin") version "1.9.0"
    id("org.jetbrains.kotlinx.kover") version "0.9.1"
}

group = "uk.co.suskins"
version = "1.0.0"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

configurations {
    compileOnly {
        extendsFrom(configurations.annotationProcessor.get())
    }
}

repositories {
    mavenCentral()
}

extra["forkhandlesVersion"] = "2.22.3.0"
extra["springDocVersion"] = "2.8.6"
extra["hamkrestVersion"] = "1.8.0.1"
extra["okeyDokeVersion"] = "2.0.3"

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("dev.forkhandles:result4k")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:${property("springDocVersion")}")
    implementation("io.micrometer:micrometer-registry-prometheus")

    developmentOnly("org.springframework.boot:spring-boot-devtools")

    runtimeOnly("com.h2database:h2")
    runtimeOnly("org.postgresql:postgresql")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testImplementation("com.natpryce:hamkrest:${property("hamkrestVersion")}")
    testImplementation("dev.forkhandles:result4k-hamkrest")
    testImplementation("com.oneeyedmen:okeydoke:${property("okeyDokeVersion")}")

    testFixturesImplementation("dev.forkhandles:result4k")

    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

dependencyManagement {
    imports {
        mavenBom("dev.forkhandles:forkhandles-bom:${property("forkhandlesVersion")}")
    }
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

allOpen {
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}

tasks.withType<Test> {
    useJUnitPlatform()

    testLogging {
        events("passed", "skipped", "failed")
    }
}

tasks.test {
    useJUnitPlatform {
        excludeTags("integration")
    }
}
tasks.register<Test>("integrationTest") {
    description = "Run integration tests"
    group = "verification"

    useJUnitPlatform {
        includeTags("integration")
    }

    shouldRunAfter("test")
}

openApi {
    apiDocsUrl.set("http://localhost:8080/v3/api-docs")
    outputDir.set(file("$buildDir/docs"))
    outputFileName.set("openapi.json")
    waitTimeInSeconds.set(10)
    customBootRun {
        args.set(listOf("--spring.profiles.active=local"))
    }
}
