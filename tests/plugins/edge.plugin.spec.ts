/*
 * @adonisjs/inertia
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { Edge } from 'edge.js'
import { test } from '@japa/runner'

import { edgePluginInertia } from '../../src/plugins/edge/plugin.js'

test.group('Edge plugin', () => {
  test('generate script with page JSON and root div for mounting', async ({ assert }) => {
    const edge = Edge.create().use(edgePluginInertia())
    edge.registerTemplate('components/layout', {
      template: `@inertia()`,
    })
    edge.registerTemplate('root_template', {
      template: `@!component('components/layout', { page })`,
    })
    const html = await edge.render('root_template', { page: {} })
    assert.deepEqual(html.split('\n'), [
      '<script data-page="app" type="application/json">{}</script><div id="app"></div>',
    ])
  })

  test('@inertia generate script with page JSON and root div', async ({ assert }) => {
    const edge = Edge.create().use(edgePluginInertia())
    edge.registerTemplate('components/layout', {
      template: `@inertia()`,
    })
    edge.registerTemplate('root_template', {
      template: `@!component('components/layout', { page })`,
    })

    const html = await edge.render('root_template', {
      page: { foo: 'bar' },
    })

    assert.deepEqual(html.split('\n'), [
      '<script data-page="app" type="application/json">{"foo":"bar"}</script><div id="app"></div>',
    ])
  })

  test('throw error when invalid arguments are provided to the @inertia tag', async () => {
    const edge = Edge.create().use(edgePluginInertia())

    await edge.renderRaw(`@inertia('foo')`, { page: {} })
  }).throws(`"('foo')" is not a valid argument for @inertia`)

  test('pass through HTML attributes via @inertia tag', async ({ assert }) => {
    const edge = Edge.create().use(edgePluginInertia())

    const html = await edge.renderRaw(`@inertia({ class: 'foo' })`, {
      page: {},
    })

    assert.deepEqual(html.split('\n'), [
      '<script data-page="app" type="application/json">{}</script><div id="app" class="foo"></div>',
    ])
  })

  test('render root div as another tag', async ({ assert }) => {
    const edge = Edge.create().use(edgePluginInertia())

    const html = await edge.renderRaw(`@inertia({ as: 'main' })`, {
      page: {},
    })

    assert.deepEqual(html.split('\n'), [
      '<script data-page="app" type="application/json">{}</script><main id="app"></main>',
    ])
  })

  test('escape HTML special characters in JSON content', async ({ assert }) => {
    const edge = Edge.create().use(edgePluginInertia())
    const page = {
      content: '<section><p>builder</p></section></script><div id="preview">x</div>',
    }

    const html = await edge.renderRaw(`@inertia()`, { page })
    // Unicode escapes prevent HTML tag interpretation while keeping JSON valid
    assert.include(html, '\\u003c')
    assert.include(html, '\\u003e')
  })

  test('escape all HTML-like content including opening tags and entities', async ({ assert }) => {
    const edge = Edge.create().use(edgePluginInertia())
    const page = {
      html: '<script>alert("xss")</script>',
      entity: 'Tom & Jerry',
      tags: '<div><span>nested</span></div>',
    }

    const html = await edge.renderRaw(`@inertia()`, { page })
    // Verify Unicode escapes are applied (prevents any HTML interpretation)
    assert.include(html, '\\u003c')
    assert.include(html, '\\u003e')
    assert.include(html, '\\u0026')
  })

  test('render SSR body when exists', async ({ assert }) => {
    const edge = Edge.create().use(edgePluginInertia())

    const html = await edge.renderRaw(`@inertia()`, {
      page: { ssrBody: '<div>foo</div>' },
    })

    assert.deepEqual(html.split('\n'), ['<div>foo</div>'])
  })
})
