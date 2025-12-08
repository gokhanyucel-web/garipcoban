Task: We need to finalize the Search UI with visuals, clean up the Profile, and fix a Modal Layering bug.

1. Add Posters to Search Results (Crucial UX):

Problem: Searching for films (both Global Search and Add-to-Tier Modal) only shows text names. It's hard to identify movies.

Fix: In BOTH search result lists (Global Search overlay & Tier Search modal):

Display the Poster Image (film.posterUrl) next to the title.

Layout: Small thumbnail (w-12 h-16 or similar) on the left, Title/Year on the right.

If no poster, show a placeholder black box.

2. Fix "Bleeding" in Tier Search Modal:

Problem: When the "Add to Tier" modal is open, elements from the background (like the red 'X' buttons of existing cards) are bleeding through or visible on top.

Fix: Ensure the Modal Overlay has z-index: 60 (or higher than the cards). Ensure the red 'X' buttons on cards have a z-index that is LOWER than the modal overlay.

3. Remove Static Motto in Profile:

Task: In the "Right: Stats & Archetype" section of the Profile tab, DELETE the hardcoded paragraph: "Cinema is truth 24 times a second.".

Reason: The user now sets their own dynamic motto on the left side. We don't need this duplicate static text.

4. Verify "Published Journeys":

Task: Ensure that lists with status === 'published' are correctly appearing in the "Published Journeys" section of the Vault. (Logic seems correct, just verify the rendering is robust).

Output: Provide the FULL RAW CODE for src/App.tsx.