// Static image imports (`import logo from '../public/logo.png'`) are typed by
// Next's image module declarations. They normally arrive through the
// generated, gitignored `next-env.d.ts`, which does not exist on a fresh
// clone until `next build`/`next dev` has run, so `npm run typecheck` failed
// on a clean checkout (#65). Referencing them from a committed file makes
// typecheck independent of that generated file.
/// <reference types="next/image-types/global" />
