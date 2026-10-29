import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BrandWordmark } from "@/components/BrandWordmark";

const colorTokens = [
  { name: "Background", token: "--color-background", value: "#F8F7F4" },
  { name: "Surface", token: "--color-surface", value: "#FFFFFF" },
  { name: "Foreground", token: "--color-foreground", value: "#171717" },
  { name: "Muted", token: "--color-muted", value: "#737373" },
  { name: "Border", token: "--color-border", value: "#E5E1DA" },
  { name: "Accent", token: "--color-accent", value: "#A18A68" },
  { name: "Dark", token: "--color-dark", value: "#111111" },
  { name: "Dark text", token: "--color-dark-text", value: "#F8F7F4" },
];

export default function DesignSystemPage() {
  return (
    <main id="main-content" className="design-system-page">
      <Container className="design-system-intro">
        <p className="eyebrow">MALYK / Foundation</p>
        <h1>Design system</h1>
        <p>
          A shared visual language for modern expression and timeless presence.
          This internal preview demonstrates the reusable foundations for the
          next phase of the store.
        </p>
        <p className="preview-note">
          Category and information links are temporary destinations for this
          design preview. Shopping, search, account, and newsletter features are
          not active.
        </p>
      </Container>

      <section className="preview-section" aria-labelledby="identity-title">
        <Container>
          <SectionHeading
            id="identity-title"
            eyebrow="01 / Identity"
            title="Understated, by intention."
            description="A considered identity designed to feel confident without competing for attention."
          />
          <div className="identity-sample">
            <BrandWordmark className="identity-sample__wordmark" />
            <p>Modern Expression. Timeless Presence.</p>
          </div>
        </Container>
      </section>

      <section className="preview-section" aria-labelledby="color-title">
        <Container>
          <SectionHeading
            id="color-title"
            eyebrow="02 / Color"
            title="A grounded palette."
            description="Warm ivory, quiet neutrals, and near-black establish the canvas; muted taupe is reserved for subtle emphasis."
          />
          <div className="color-grid">
            {colorTokens.map((color) => (
              <div className="color-swatch" key={color.token}>
                <span
                  className="color-swatch__sample"
                  style={{ backgroundColor: color.value }}
                  aria-label={`${color.name} color sample, ${color.value}`}
                />
                <span className="color-swatch__name">{color.name}</span>
                <code>{color.value}</code>
                <code>{color.token}</code>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="preview-section" aria-labelledby="type-title">
        <Container>
          <SectionHeading
            id="type-title"
            eyebrow="03 / Typography"
            title="Editorial contrast."
            description="Cormorant Garamond brings a literary quality to headlines; Manrope keeps navigation and body copy clear."
          />
          <div className="type-samples">
            <p className="type-samples__display">A sense of the considered.</p>
            <h3>Modern essentials, made personal.</h3>
            <p className="type-samples__body">
              Contemporary fashion finds its meaning in how it is worn. Our
              visual language pairs expressive editorial type with direct,
              readable copy.
            </p>
            <p className="eyebrow">Small label / Manrope uppercase</p>
          </div>
        </Container>
      </section>

      <section
        className="preview-section"
        id="buttons"
        aria-labelledby="button-title"
      >
        <Container>
          <SectionHeading
            id="button-title"
            eyebrow="04 / Controls"
            title="Quietly clear."
            description="Buttons use simple forms, tactile contrast, and visible keyboard focus."
          />
          <div className="button-samples">
            <Button href="#container-examples">Primary link</Button>
            <Button href="#container-examples" variant="secondary">
              Secondary link
            </Button>
            <Button href="#container-examples" variant="text">
              Text link
            </Button>
            <Button disabled>Disabled</Button>
          </div>
          <p className="interaction-hint">
            Focus a control with Tab to see its focus ring. Hover and press the
            links for restrained feedback.
          </p>
        </Container>
      </section>

      <section className="preview-section" aria-labelledby="heading-title">
        <Container>
          <SectionHeading
            id="heading-title"
            eyebrow="05 / Section heading"
            title="A consistent editorial rhythm."
            description="Section headings share an optional eyebrow and supporting copy."
            align="center"
          />
        </Container>
      </section>

      <section
        className="preview-section"
        id="container-examples"
        aria-labelledby="container-title"
      >
        <Container>
          <SectionHeading
            id="container-title"
            eyebrow="06 / Layout"
            title="Space to breathe."
            description="Containers use a consistent responsive gutter and a small set of purposeful widths."
          />
        </Container>
        <Container width="narrow" className="layout-sample layout-sample--narrow">
          Narrow container · 42rem maximum
        </Container>
        <Container width="content" className="layout-sample">
          Content container · 60rem maximum
        </Container>
        <Container width="wide" className="layout-sample">
          Wide container · 80rem maximum
        </Container>
      </section>

      <section className="preview-section" aria-labelledby="spacing-title">
        <Container>
          <SectionHeading
            id="spacing-title"
            eyebrow="07 / Details"
            title="Fine lines, steady rhythm."
            description="Borders and spacing provide structure without relying on heavy shadows or excessive rounding."
          />
          <div className="spacing-sample">
            <div><span>Space 1</span><i className="space-bar space-bar--1" /></div>
            <div><span>Space 2</span><i className="space-bar space-bar--2" /></div>
            <div><span>Space 3</span><i className="space-bar space-bar--3" /></div>
            <div><span>Space 4</span><i className="space-bar space-bar--4" /></div>
          </div>
        </Container>
      </section>
    </main>
  );
}
