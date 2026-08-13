use serde::Deserialize;
use std::io::Read;

#[derive(Debug, Deserialize)]
struct Ir {
    roots: Vec<Root>,
}

#[derive(Debug, Deserialize)]
struct Root {
    name: String,
    node: Node,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
enum Node {
    Concept {
        #[serde(default)]
        prompt: Option<String>,
        #[serde(default)]
        fill: Vec<Field>,
    },
    Reference {
        #[serde(default)]
        prompt: Option<String>,
        to: Option<String>,
    },
    Shape {
        #[serde(default)]
        prompt: Option<String>,
        to: Option<String>,
        #[serde(default)]
        fill: Vec<Field>,
    },
    Collection {
        #[serde(default)]
        prompt: Option<String>,
        inner: Box<Node>,
    },
    Optional {
        #[serde(default)]
        prompt: Option<String>,
        inner: Box<Node>,
    },
    Choice {
        #[serde(default)]
        prompt: Option<String>,
        #[serde(default)]
        cases: Vec<Node>,
    },
}

#[derive(Debug, Deserialize)]
struct Field {
    key: String,
    node: Node,
}

fn main() {
    let mut input = String::new();
    std::io::stdin()
        .read_to_string(&mut input)
        .expect("read stdin");
    let ir: Ir = serde_json::from_str(&input).expect("parse IR");
    println!("{ir:#?}");
}
